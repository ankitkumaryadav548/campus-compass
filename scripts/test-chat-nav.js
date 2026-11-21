// scripts/test-chat-nav.js
const mongoose = require("mongoose");
const baseUrl = "http://localhost:3000";

async function testFlow() {
  await mongoose.connect(process.env.MONGODB_URI);
  const moses = await mongoose.connection.collection("users").findOne({ email: "moses.kato@sample.test" });

  const csrfRes = await fetch(baseUrl + "/api/auth/csrf");
  const csrfCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get("set-cookie")];
  const { csrfToken } = await csrfRes.json();

  const loginRes = await fetch(baseUrl + "/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookies.map(c => c.split(";")[0]).join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: "moses.kato@sample.test",
      password: "Sample@123",
      redirect: "false",
      json: "true",
    }),
  });

  const sessionCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie")];
  const cookieHeader = sessionCookies.map(c => c.split(";")[0]).join("; ");

  console.log("Moses logged in, testing matches...");

  const matches = await mongoose.connection.collection("buddymatches").find({
    $or: [{ requesterId: moses._id }, { recipientId: moses._id }]
  }).toArray();

  for (const m of matches) {
    console.log("Match:", m._id.toString(), "status:", m.status);
    const chatRes = await fetch(baseUrl + "/community/chat/" + m._id.toString(), {
      headers: { Cookie: cookieHeader },
      redirect: "manual",
    });
    console.log("  Status:", chatRes.status, "location:", chatRes.headers.get("location"));
  }

  await mongoose.disconnect();
}

testFlow().catch(console.error);
