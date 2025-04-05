require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 3000;

const CONFIG = {
	ZOOM_API_ENDPOINT: "wss://your-zoom-websocket-endpoint.com",
	CHATGPT_API_KEY: process.env.CHATGPT_API_KEY,
	MAX_TRANSCRIPT_LENGTH: 4000, // Max characters to send to ChatGPT
};

// Middleware to parse JSON requests
app.use(cors());
app.use(express.json());

// Defines a route that makes a call to the OpenAI API
app.post("/translate", async (req, res) => {
	console.log("Received request body:", req.body);

	try {
		const { text } = req.body;

		if (!text) {
			throw new Error("No text provided in request");
		}

		console.log("Making request to OpenAI with text:", text);

		const response = await axios.post(
			"https://api.openai.com/v1/chat/completions",
			{
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content:
							"You are an expert educator that creates excellent study notes from classroom discussions.",
					},
					{
						role: "user",
						content: `Make this transcript into a note: "${text}"`,
					},
				],
				max_tokens: 60,
				temperature: 0.7,
			},
			{
				headers: {
					Authorization: `Bearer ${CONFIG.CHATGPT_API_KEY}`,
					"Content-Type": "application/json",
				},
				timeout: 10000, // 10 second timeout
			}
		);

		console.log("OpenAI response:", response.data);

		if (!response.data.choices?.[0]?.message?.content) {
			throw new Error("Unexpected response format from OpenAI");
		}

		res.json({
			translatedText: response.data.choices[0].message.content,
		});
	} catch (error) {
		console.error("Full error:", error);
		console.error("Error response:", error.response?.data);
		res.status(500).json({
			error: "Translation failed",
			details: error.message,
			apiError: error.response?.data,
		});
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server is listening.`);
});
