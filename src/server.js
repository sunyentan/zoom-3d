require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 3000;

const CONFIG = {
	ZOOM_API_ENDPOINT: process.env.ZOOM_API_ENDPOINT,
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
						content: createNoteGenerationPrompt(text),
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

// General route to call ChatGPT with any prompt
app.post("/chat", async (req, res) => {
	console.log("Received request body:", req.body);

	try {
		const { messages, model, temperature, max_tokens } = req.body;

		// Validate required fields
		if (!messages || !Array.isArray(messages)) {
			throw new Error("Messages array is required");
		}

		// Set defaults if not provided
		const requestConfig = {
			model: model || "chatgpt-4o-latest",
			messages,
			temperature: temperature || 0.7,
			max_tokens: max_tokens || 500, // Increased default token limit
		};

		console.log("Making request to OpenAI with config:", requestConfig);

		const response = await axios.post("https://api.openai.com/v1/chat/completions", requestConfig, {
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			timeout: 15000, // 15 second timeout
		});

		console.log("OpenAI response:", response.data);

		if (!response.data.choices?.[0]?.message?.content) {
			throw new Error("Unexpected response format from OpenAI");
		}

		res.json({
			success: true,
			response: response.data.choices[0].message.content,
			usage: response.data.usage,
		});
	} catch (error) {
		console.error("Full error:", error);
		console.error("Error response:", error.response?.data);
		res.status(500).json({
			success: false,
			error: "Chat completion failed",
			details: error.message,
			apiError: error.response?.data,
		});
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server is listening.`);
});

// Create the user prompt for ChatGPT
function createNoteGenerationPrompt(transcript) {
	return `
    Analyze the following lesson transcript and create a concise study note that captures the key concepts being taught. 
    The note should be structured for easy review by students and should exclude irrelevant conversation.

    Guidelines:
    1. Focus on educational content, not administrative talk
    2. Organize information logically
    3. Use bullet points for clarity
    4. Highlight key terms and definitions
    5. Include examples when relevant
    6. Keep it concise (less than 100 words)
    7. Do not add additional information of your own. If there is insufficient content to make a note, you may choose not to generate any.
    8. Use Markdown to format the response, using line breaks, bold, etc whenever possible.

    Transcript:
    ${transcript}

    Please generate the study note now:
    `;
}
