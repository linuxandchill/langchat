// import { ChatOpenAI } from "langchain/chat_models";
import { NextResponse } from "next/server";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { LLMChain } from "langchain/chains";
import { CallbackManager } from "langchain/callbacks";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
} from "langchain/prompts";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const config = {
    runtime: "edge",
};

export default async function handler(req, res) {
    const { query, history } = req.body;

    const prompt = ChatPromptTemplate.fromPromptMessages([
        HumanMessagePromptTemplate.fromTemplate("{query}"),
    ]);

    try {
        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not defined.");
        }

        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        const llm = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.9,
            streaming: true,
            callbackManager: CallbackManager.fromHandlers({
                handleLLMNewToken: async (token) => {
                    await writer.ready;
                    await writer.write(encoder.encode(`${token}`));
                },
                handleLLMEnd: async () => {
                    await writer.ready;
                    await writer.close();
                },
                handleLLMError: async (e) => {
                    await writer.ready;
                    await writer.abort(e);
                },
            }),
        });

        const chain = new LLMChain({ prompt, llm });
        // We don't need to await the result of the chain.run() call because
        // the LLM will invoke the callbackManager's handleLLMEnd() method
        // Run the chain but don't await it
        chain.run("hello").catch(console.error);

        return new NextResponse(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        // console.error(error);
        // res.status(500).send("Internal Server Error");
        return new Response(
            JSON.stringify(
                { error: error.message },
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            )
        );
    }

    // try {
    //     if (!OPENAI_API_KEY) {
    //         throw new Error("OPENAI_API_KEY is not defined.");
    //     }

    //     res.writeHead(200, {
    //         "Content-Type": "text/event-stream",
    //         "Cache-Control": "no-cache, no-transform",
    //         Connection: "keep-alive",
    //     });

    //     const sendToken = (data) => {
    //         res.write(`${data}`);
    //     };

    //     const model = new ChatOpenAI({
    //         openAIApiKey: OPENAI_API_KEY,
    //         temperature: 0.9,
    //         streaming: true,
    //         callbackManager: CallbackManager.fromHandlers({
    //             async handleLLMNewToken(token) {
    //                 console.log(token)
    //                 sendToken(token);
    //             },
    //             async handleLLMEnd(done) {
    //                 console.log(done);
    //             },
    //         }),
    //     });

    //     await model.call([
    //         new SystemChatMessage(
    //             "You are a helpful assistant that answers questions as best you can."
    //         ),
    //         new HumanChatMessage(query),
    //     ]);

    //     res.end();
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send("Internal Server Error");
    // }
}

// try {
//     if (!OPENAI_API_KEY) {
//         throw new Error("OPENAI_API_KEY is not defined.");
//     }

//     res.writeHead(200, {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache, no-transform",
//         Connection: "keep-alive",
//     });

//     const sendToken = (data) => {
//         res.write(`${data}`);
//     };

//     const model = new ChatOpenAI({
//         openAIApiKey: OPENAI_API_KEY,
//         temperature: 0.9,
//         streaming: true,
//         callbackManager: CallbackManager.fromHandlers({
//             async handleLLMNewToken(token) {
//                 console.log(token)
//                 sendToken(token);
//             },
//             async handleLLMEnd(done) {
//                 console.log(done);
//             },
//         }),
//     });

//     await model.call([
//         new SystemChatMessage(
//             "You are a helpful assistant that answers questions as best you can."
//         ),
//         new HumanChatMessage(query),
//     ]);

//     res.end();
// } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
// }
