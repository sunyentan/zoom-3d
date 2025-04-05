require("dotenv").config();

// Configuration
const CONFIG = {
	ZOOM_API_ENDPOINT: "wss://your-zoom-websocket-endpoint.com",
	CHATGPT_API_KEY: process.env.CHATGPT_API_KEY,
	NOTE_GENERATION_INTERVAL: 120000, // Generate notes every 2 minutes
	MAX_TRANSCRIPT_LENGTH: 4000, // Max characters to send to ChatGPT
};

// State management
const appState = {
	transcriptStream: [],
	generatedNotes: [],
	noteGenerationInterval: null,
	websocket: null,
};

// DOM Elements
const elements = {
	transcriptDisplay: document.getElementById("transcript-display"),
	notesDisplay: document.getElementById("notes-display"),
	connectionStatus: document.getElementById("connection-status"),
	transcriptStatus: document.getElementById("transcript-status"),
	noteModal: document.getElementById("note-modal"),
	modalNoteContent: document.getElementById("modal-note-content"),
	understandBtn: document.getElementById("understand-btn"),
	confusedBtn: document.getElementById("confused-btn"),
	manualTranscriptInput: document.getElementById("manual-transcript-input"),
	speakerNameInput: document.getElementById("speaker-name"),
	submitManualTranscriptBtn: document.getElementById("submit-manual-transcript"),
};

// Initialize the application
function init() {
	setupWebSocket();
	setupEventListeners();
	startNoteGenerationInterval();
}

// Set up WebSocket connection to Zoom API
function setupWebSocket() {
	appState.websocket = new WebSocket(CONFIG.ZOOM_API_ENDPOINT);

	appState.websocket.onopen = () => {
		elements.connectionStatus.textContent = "Connected";
		elements.connectionStatus.classList.remove("status-offline");
		elements.connectionStatus.classList.add("status-online");
	};

	appState.websocket.onmessage = (event) => {
		const transcriptData = JSON.parse(event.data);
		processTranscript(transcriptData);
	};

	appState.websocket.onclose = () => {
		elements.connectionStatus.textContent = "Offline";
		elements.connectionStatus.classList.remove("status-online");
		elements.connectionStatus.classList.add("status-offline");
	};
}

// Process incoming transcript data
function processTranscript(transcriptData) {
	// Add source tracking
	transcriptData.source = transcriptData.source || "zoom";

	appState.transcriptStream.push(transcriptData);
	updateTranscriptDisplay(transcriptData);

	// Update status with source info
	const source = transcriptData.source === "manual" ? "Manual Input" : "Zoom";
	elements.transcriptStatus.textContent = `Last update: ${new Date().toLocaleTimeString()} (${
		transcriptData.speaker
	}, ${source})`;

	if (appState.transcriptStream.length > 50) {
		appState.transcriptStream.shift();
	}
}

// Update the transcript display
function updateTranscriptDisplay(transcriptData) {
	const transcriptItem = document.createElement("div");
	transcriptItem.className = `transcript-item ${transcriptData.source}`;

	const speaker = document.createElement("strong");
	speaker.textContent = transcriptData.speaker;

	const sourceBadge = document.createElement("span");
	sourceBadge.className = "source-badge";
	sourceBadge.textContent = transcriptData.source === "manual" ? "Manual" : "Zoom";

	const text = document.createElement("p");
	text.textContent = transcriptData.text;

	transcriptItem.appendChild(speaker);
	transcriptItem.appendChild(sourceBadge);
	transcriptItem.appendChild(text);
	elements.transcriptDisplay.appendChild(transcriptItem);

	elements.transcriptDisplay.scrollTop = elements.transcriptDisplay.scrollHeight;
}

// Start the interval for generating notes
function startNoteGenerationInterval() {
	appState.noteGenerationInterval = setInterval(() => {
		if (appState.transcriptStream.length > 0) {
			generateStudyNote();
		}
	}, CONFIG.NOTE_GENERATION_INTERVAL);
}

// Generate a study note using ChatGPT API
async function generateStudyNote() {
	try {
		// Prepare transcript text for ChatGPT
		const recentTranscript = appState.transcriptStream
			.slice(-20) // Get last 20 transcript items
			.map((item) => `${item.speaker}: ${item.text}`)
			.join("\n");

		// Truncate if too long
		const transcriptForGPT =
			recentTranscript.length > CONFIG.MAX_TRANSCRIPT_LENGTH
				? recentTranscript.substring(0, CONFIG.MAX_TRANSCRIPT_LENGTH) + "... [truncated]"
				: recentTranscript;

		// ChatGPT prompt
		const prompt = createNoteGenerationPrompt(transcriptForGPT);

		// Call ChatGPT API
		const response = await callChatGPT(prompt);

		if (response) {
			const note = {
				id: Date.now(),
				timestamp: new Date().toISOString(),
				content: response,
				transcriptContext: transcriptForGPT,
			};

			showNoteForConfirmation(note);
		}
	} catch (error) {
		console.error("Error generating note:", error);
	}
}

// Create the prompt for ChatGPT
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
    6. Keep it concise (150-300 words)
    7. Format with Markdown for headings, lists, etc.

    Transcript:
    ${transcript}

    Please generate the study note now:
    `;
}

// Call ChatGPT API
async function callChatGPT(prompt) {
	try {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${CONFIG.CHATGPT_API_KEY}`,
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content:
							"You are an expert educator that creates excellent study notes from classroom discussions.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 500,
			}),
		});

		const data = await response.json();
		return data.choices[0]?.message?.content || "";
	} catch (error) {
		console.error("Error calling ChatGPT API:", error);
		return null;
	}
}

// Show the generated note to the user for confirmation
function showNoteForConfirmation(note) {
	elements.modalNoteContent.innerHTML = marked.parse(note.content); // Using marked.js for Markdown rendering
	elements.noteModal.style.display = "block";

	// Store the current note in a data attribute
	elements.noteModal.dataset.currentNote = JSON.stringify(note);
}

// Handle user confirmation of understanding
function handleUnderstand() {
	const note = JSON.parse(elements.noteModal.dataset.currentNote);
	saveNote(note);
	elements.noteModal.style.display = "none";
}

// Handle user confusion
function handleConfused() {
	// Just close the modal, don't save the note
	elements.noteModal.style.display = "none";
}

// Save the note to local storage and display
function saveNote(note) {
	appState.generatedNotes.push(note);
	updateNotesDisplay(note);
	saveNotesToLocalStorage();
}

// Update the notes display
function updateNotesDisplay(note) {
	const noteItem = document.createElement("div");
	noteItem.className = "note-item";
	noteItem.innerHTML = marked.parse(note.content);

	const timestamp = document.createElement("div");
	timestamp.className = "note-timestamp";
	timestamp.textContent = new Date(note.timestamp).toLocaleString();
	noteItem.appendChild(timestamp);

	elements.notesDisplay.appendChild(noteItem);
	elements.notesDisplay.scrollTop = elements.notesDisplay.scrollHeight;
}

// Save notes to local storage
function saveNotesToLocalStorage() {
	localStorage.setItem("zoomLessonNotes", JSON.stringify(appState.generatedNotes));
}

// Load notes from local storage
function loadNotesFromLocalStorage() {
	const savedNotes = localStorage.getItem("zoomLessonNotes");
	if (savedNotes) {
		appState.generatedNotes = JSON.parse(savedNotes);
		appState.generatedNotes.forEach((note) => updateNotesDisplay(note));
	}
}

// Set up event listeners
function setupEventListeners() {
	elements.understandBtn.addEventListener("click", handleUnderstand);
	elements.confusedBtn.addEventListener("click", handleConfused);
	elements.submitManualTranscriptBtn.addEventListener("click", handleManualTranscriptSubmit);

	// Close modal when clicking outside
	window.addEventListener("click", (event) => {
		if (event.target === elements.noteModal) {
			elements.noteModal.style.display = "none";
		}
	});
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	init();
	loadNotesFromLocalStorage();
});

// New handler for manual transcript submission
function handleManualTranscriptSubmit() {
	const text = elements.manualTranscriptInput.value.trim();
	const speaker = elements.speakerNameInput.value.trim() || "User";

	if (!text) {
		alert("Please enter some transcript text");
		return;
	}

	const manualTranscript = {
		speaker,
		text,
		timestamp: new Date().toISOString(),
		source: "manual",
	};

	// Process it like we do with Zoom API transcripts
	processTranscript(manualTranscript);

	// Clear the input
	elements.manualTranscriptInput.value = "";

	// Optional: Auto-generate a note
	setTimeout(() => {
		generateStudyNote();
	}, 2000);
}
