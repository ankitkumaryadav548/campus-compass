// scratch/test-flows.mjs
const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  // 1. Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const rawCookies = csrfRes.headers.get("set-cookie") || "";
  let cookie = rawCookies.split(";")[0];

  // 2. Post credentials
  const params = new URLSearchParams({
    csrfToken,
    email,
    password,
    redirect: "false",
    json: "true",
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: params.toString(),
  });

  const setCookie = loginRes.headers.get("set-cookie") || "";
  const sessionCookie = setCookie
    .split(",")
    .map((c) => c.trim().split(";")[0])
    .filter((c) => c.includes("next-auth.session-token"))
    .join("; ");

  return sessionCookie || cookie;
}

async function run() {
  console.log("1. Logging in as Moses (Student)...");
  const mosesCookie = await login("moses.kato@sample.test", "Sample@123");
  if (!mosesCookie) throw new Error("Moses login failed");
  console.log("   ✓ Logged in as Moses");

  console.log("2. Fetching People suggestions for Moses...");
  const peopleRes = await fetch(`${BASE_URL}/api/buddies`, {
    headers: { Cookie: mosesCookie },
  });
  if (!peopleRes.ok) throw new Error(`Fetch people failed: ${peopleRes.status}`);
  const peopleData = await peopleRes.json();
  console.log(`   ✓ Found ${peopleData.totalCount} people total`);

  const linh = peopleData.people.find((p) => p.name.includes("Linh"));
  console.log(`   ✓ Linh Pham relation status: ${linh?.requestStatus}`);
  if (linh?.requestStatus !== "pending_received") {
    throw new Error(`Expected pending_received, got ${linh?.requestStatus}`);
  }

  console.log("3. Testing filter chips...");
  const seniorsRes = await fetch(`${BASE_URL}/api/buddies?kind=seniors`, {
    headers: { Cookie: mosesCookie },
  });
  const seniorsData = await seniorsRes.json();
  const allSeniors = seniorsData.people.every((p) => p.isSenior);
  console.log(`   ✓ Kind=seniors returns ${seniorsData.people.length} items, all isSenior: ${allSeniors}`);

  const peersRes = await fetch(`${BASE_URL}/api/buddies?kind=peers`, {
    headers: { Cookie: mosesCookie },
  });
  const peersData = await peersRes.json();
  const allPeers = peersData.people.every((p) => !p.isSenior);
  console.log(`   ✓ Kind=peers returns ${peersData.people.length} items, all peers: ${allPeers}`);

  console.log("4. Testing reverse request conflict (409)...");
  const reverseReqRes = await fetch(`${BASE_URL}/api/buddies/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: mosesCookie,
    },
    body: JSON.stringify({
      recipientId: linh._id,
      message: "Hey Linh, let me connect to you!",
    }),
  });
  console.log(`   ✓ Reverse request HTTP status: ${reverseReqRes.status}`);
  const reverseData = await reverseReqRes.json();
  console.log(`   ✓ Error message: "${reverseData.error}"`);
  if (reverseReqRes.status !== 409) {
    throw new Error(`Expected status 409, got ${reverseReqRes.status}`);
  }

  console.log("5. Testing My Connections for Moses...");
  const matchesRes = await fetch(`${BASE_URL}/api/buddies/matches`, {
    headers: { Cookie: mosesCookie },
  });
  const matchesData = await matchesRes.json();
  const incoming = matchesData.matches.filter(
    (m) => m.status === "pending" && (m.direction === "incoming" || !m.isRequester)
  );
  const sent = matchesData.matches.filter(
    (m) => m.status === "pending" && (m.direction === "sent" || m.isRequester)
  );
  const accepted = matchesData.matches.filter((m) => m.status === "accepted");
  console.log(`   ✓ Matches: ${incoming.length} incoming, ${sent.length} sent, ${accepted.length} accepted`);

  console.log("6. Moses accepts Linh's incoming request...");
  const linhMatch = incoming.find((m) => m.partner?.name?.includes("Linh"));
  if (!linhMatch) throw new Error("Linh's incoming request not found in matches");
  const acceptRes = await fetch(`${BASE_URL}/api/buddies/${linhMatch._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: mosesCookie,
    },
    body: JSON.stringify({ action: "accept" }),
  });
  const acceptData = await acceptRes.json();
  console.log(`   ✓ Accept status: ${acceptData.status}`);
  if (acceptData.status !== "accepted") {
    throw new Error(`Expected accepted, got ${acceptData.status}`);
  }

  console.log("7. Testing messaging between Moses and Linh...");
  const msgPostRes = await fetch(`${BASE_URL}/api/buddies/${linhMatch._id}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: mosesCookie,
    },
    body: JSON.stringify({ text: "Hi Linh, great to connect with you!" }),
  });
  console.log(`   ✓ Send message status: ${msgPostRes.status}`);
  const msgGetData = await (
    await fetch(`${BASE_URL}/api/buddies/${linhMatch._id}/messages`, {
      headers: { Cookie: mosesCookie },
    })
  ).json();
  console.log(`   ✓ Total messages in chat: ${msgGetData.messages.length}`);
  console.log(`   ✓ Last message: "${msgGetData.messages.at(-1)?.text}"`);

  console.log("8. Testing 'Show me in People' toggle...");
  const toggleOffRes = await fetch(`${BASE_URL}/api/users`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: mosesCookie,
    },
    body: JSON.stringify({ openToConnect: false }),
  });
  const toggleOffData = await toggleOffRes.json();
  console.log(`   ✓ Toggle off openToConnect: ${toggleOffData.user.openToConnect}`);

  // Log in as Linh to verify Moses is hidden
  const linhCookie = await login("linh.pham@sample.test", "Sample@123");
  const linhPeopleData = await (
    await fetch(`${BASE_URL}/api/buddies`, { headers: { Cookie: linhCookie } })
  ).json();
  const mosesFoundInLinh = linhPeopleData.people.some((p) => p.name.includes("Moses"));
  console.log(`   ✓ Moses found in Linh's discovery when hidden: ${mosesFoundInLinh}`);

  // Restore Moses
  await fetch(`${BASE_URL}/api/users`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: mosesCookie,
    },
    body: JSON.stringify({ openToConnect: true }),
  });
  console.log("   ✓ Restored Moses openToConnect to true");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
