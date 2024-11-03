import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie"; // Import the cookie functions
import { nanoid } from "nanoid"; // For generating unique user IDs

const app = new Hono();

// CORS Headers Helper
const addCORSHeaders = (response) => {
	response.headers.set("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
	response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	response.headers.set("Access-Control-Allow-Headers", "Content-Type");
	response.headers.set("Access-Control-Allow-Credentials", "true"); // Allow credentials (cookies) in requests
	return response;
};

// Handle OPTIONS requests for CORS preflight
app.options("*", (c) => {
	const response = new Response(null, { status: 204 });
	return addCORSHeaders(response);
});

// Store memory for each user
const userMemory = {};

// Middleware to set or retrieve user ID
app.use("*", async (c, next) => {
	let userId = getCookie(c, "user_id");

	// Check if userId exists; if not, create a new one
	if (!userId) {
		userId = nanoid();
		setCookie(c, "user_id", userId, {
			path: "/",
			httpOnly: true,  // Uncomment for production
			secure: true,  // Required for cross-origin cookies in production
			sameSite: "None",  // Required for cross-origin cookies
			maxAge: 60 * 60 * 24  // 1 day
		});
		console.log("New cookie created with user_id:", userId);
	} else {
		console.log("Existing user_id cookie detected:", userId);
	}

	// Ensure a memory array exists for this user
	if (!userMemory[userId]) {
		userMemory[userId] = ["Responsibility: Take the user through an epic story where you both experience the dystopian steampunk era.", "Story Content: action filled story with jokes with continous timeline.", "Interactions: Interact with the user by carrying them thorugh a story timeline! Always offer options like A,B,C,D or open ended questions!", "Response Limit: 25 words.", "Current Character: CROW.", "Switch Character: add SWITCH 'MAN' or 'CROW' at the end of your response ex. -Switch MAN.", "Important Notes: You can't switch to the character you already are! USE '</br>' instead of '\n'"];
		console.log("New memory array created for user:", userId);
	}

	// Attach userId and user's memory array to the context
	c.set("userId", userId);
	c.set("memory", userMemory[userId]);

	await next();
});

// Add to memory
app.post("/add-memory", async (c) => {
	const { text } = await c.req.json();
	if (!text) {
		return addCORSHeaders(c.json({ error: "Missing text" }, 400));
	}

	// Use userId from context and add text to user's memory
	const userId = c.get("userId");
	userMemory[userId].push(text);

	const memory = userMemory[userId];
	const response = c.json({ message: "Memory saved", memory });
	return addCORSHeaders(response);
});

// Chat with memory
app.get("/chat", async (c) => {
	const url = new URL(c.req.raw.url);
	const question = url.searchParams.get("text");

	// Build context from user's memory
	const userId = c.get("userId");
	const memory = userMemory[userId];
	const contextMessage = memory.length
		? `Here is what I know so far:\n${memory.map((m) => `- ${m}`).join("\n")}`
		: "Start creative story and play along your role depending on user responses!";
	const systemPrompt = `Use the provided context to respond appropriately, referencing known information when possible.`;
	console.log(userMemory[userId]);
	// Generate response with context
	const { response: answer } = await c.env.AI.run(
		"@cf/meta/llama-3-8b-instruct",
		{
			messages: [
				{ role: "system", content: contextMessage },
				{ role: "system", content: systemPrompt },
				{ role: "user", content: question },
			],
		},
	);
	userMemory[userId].push("You responded: " + answer);
	return addCORSHeaders(c.text(answer));
});

// Clear user's memory
app.get("/clear-memory", (c) => {
	const userId = c.get("userId");
	deleteCookie(c, "date", {
		path: "/",
		httpOnly: true,  // Uncomment for production
		secure: true,  // Required for cross-origin cookies in production
		sameSite: "None",
	});
	userMemory[userId] = ["Responsibility: Take the user through an epic story where you both experience the dystopian steampunk era.", "Story Content: action filled story with jokes with continous timeline.", "Interactions: Interact with the user by carrying them thorugh a story timeline! Always offer options like A,B,C,D or open ended questions!", "Response Limit: 25 words.", "Current Character: CROW.", "Switch Character: add SWITCH 'MAN' or 'CROW' at the end of your response ex. -Switch MAN.", "Important Notes: You can't switch to the character you already area! MAKE SURE TO END WITH A QUESTION"];// Reset user's memory
	const response = c.json({ message: "Memory cleared" });
	return addCORSHeaders(response);
});

app.get("/date", (c) => {
	let start = new Date(1820, 1, 1), end = new Date(1900, 1, 1);
	let setDate = getCookie(c, "date");
	let newDate = false;
	const userId = c.get("userId");
	console.log(setDate);
	if (!setDate) {
		setDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString('En-us');
		setCookie(c, "date", setDate, {
			path: "/",
			httpOnly: true,  // Uncomment for production
			secure: true,  // Required for cross-origin cookies in production
			sameSite: "None",  // Required for cross-origin cookies
			maxAge: 60 * 60 * 24  // 1 day
		});
		newDate = true;
	}
	console.log(userMemory[userId]);
	const response = c.json({ date: setDate, new: newDate })
	return addCORSHeaders(response);
})

export default app;
