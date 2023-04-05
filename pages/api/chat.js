import { ChatOpenAI } from "langchain/chat_models";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
import { CallbackManager } from "langchain/callbacks";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
    const { query, history } = req.body;

    try {
        if (!OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not defined.");
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        });

        const sendToken = (data) => {
            res.write(`${data}`);
        };

        const model = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            temperature: 0.9,
            streaming: true,
            callbackManager: CallbackManager.fromHandlers({
                async handleLLMNewToken(token) {
                    console.log(token)
                    sendToken(token);
                },
                async handleLLMEnd(done) {
                    console.log(done);
                },
            }),
        });

        await model.call([
            new SystemChatMessage(
                "You are a helpful assistant that answers questions as best you can."
            ),
            new HumanChatMessage(query),
        ]);

        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}
