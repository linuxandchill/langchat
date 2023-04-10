import { useState, useEffect } from "react";

export default function Chat() {
    const [incoming, setIncoming] = useState( { role: "ai", message: "" });
    const [newMessage, setNewMessage] = useState( { role: "ai", message: "" } );
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [finished, setFinished] = useState(true);
    const [messages, setMessages] = useState([
        {
            role: "human",
            message: "hello mr robot 👋",
        },
        {
            role: "ai",
            message: "🤖 beep boop. hi. what do u want",
        },
    ]);

    useEffect(() => {
        setNewMessage(incoming);
    }, [incoming])

    useEffect(() => {
        if (newMessage.message) {
            setMessages((prevMsgs) => [...prevMsgs, newMessage]);
        }
    }, [finished])

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFinished(false);
        setMessages((prev) => [...prev, { role: "human", message: input }]);
        console.log(input)

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: input,
                history: [],
            }),
        });

        setInput("");
        setIncoming( { role: "ai", message: "" });

        const stream = res.body;
        console.log(stream)
        const reader = stream.getReader();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                const decodedValue = new TextDecoder().decode(value);
                console.log(decodedValue)

                setIncoming( ({ role, message }) => ({ role, message: message + decodedValue }));
            }

        } catch (error) {
            console.error(error);
        } finally {
            reader.releaseLock();
            setIncoming( { role: "ai", message: "" });
            setFinished(true)
        }
    };

    return (
        <div className="bg-slate-100">
            <div className="mx-auto max-w-[1000px] flex flex-col h-screen bg-white">
                <div
                    className="flex-grow overflow-y-auto p-4"
                >
                    <div className="flex flex-col">
                        {messages.map((message, index) => {
                            return (
                                <div
                                    key={index}
                                    className={`flex ${
                                        message.role !== "ai"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`${
                                            message.role !== "ai"
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-200"
                                        }  text-2xl p-2 rounded-md mb-2 max-w-sm`}
                                    >
                                        {message.message}
                                    </div>
                                </div>
                            );
                        })}

                        {!finished && (
                            <div className="flex justify-start bg-gray-200 text-2xl p-2 rounded-md mb-2 max-w-sm">
                                {incoming.message && incoming.message}
                            </div>
                            )
                        }
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-none p-6">
                    <div className="flex flex-col rounded-lg">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={4}
                            maxLength={200}
                            className="w-full rounded-sm border
         p-4 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none"
                            placeholder={"Ask a question"}
                        />

                        { finished ? (
                            <button
                                className="bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-500 rounded-md mt-2 px-4 py-2 text-white font-semibold focus:outline-none text-xl"
                                type="submit"
                            >
                                Submit
                            </button>
                        ) : (
                            <button disabled className="w-full">
                                <div className="animate-pulse font-bold">
                                    Thinking
                                </div>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}