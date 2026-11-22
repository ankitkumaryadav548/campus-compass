// components/modules/chat/UserMessage.jsx
// Displays a student user's message bubble on the right side.

export default function UserMessage({ message }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-primary-600 text-white px-4 py-3 shadow-sm">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
          {message.text}
        </p>
      </div>
    </div>
  );
}
