// Function to add to memory
async function addToMemory(add) {
    const text = add;
    if (!text) {
        alert("Please enter text to remember");
        return;
    }

    try {
        const response = await fetch("https://tail-of-time.josbuz211.workers.dev/add-memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // This includes cookies in the request
            body: JSON.stringify({ text })
        });

        // Log the raw response to check if it's valid JSON
        const rawText = await response.text();
        console.log("Raw response:", rawText);

        // Attempt to parse it as JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (error) {
            throw new Error(`Invalid JSON response: ${rawText}`);
        }
        console.log(data);

    } catch (error) {
        console.error("Error adding to memory:", error);
    }
}


// Function to chat with context from memory
async function getBotResponse(question) {

    try {
        const response = await fetch(`https://tail-of-time.josbuz211.workers.dev/chat?text=${encodeURIComponent(question)}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const answer = await response.text();
        return answer.toLowerCase();
    } catch (error) {
        console.error("Error asking question:", error);
        return "Something Went Wrong!";
    }
}

//reset memory Q
async function reset() {
    try {
        const response = await fetch(`https://tail-of-time.josbuz211.workers.dev/clear-memory`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error("Error resetting:", error);
        return "Something Went Wrong!";
    }
}

//get date
async function getDate() {
    try {
        const response = await fetch(`https://tail-of-time.josbuz211.workers.dev/date`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error getting date:", error);
        return "Something Went Wrong!";
    }
}

//-------------
const date = document.getElementById("date");
const resetter = document.getElementById("reset");
async function randomDate(start = new Date(1820, 1, 1), end = new Date(1900, 1, 1)) {
    let newDate = await getDate();
    console.log(newDate);
    date.innerHTML = newDate.date;
    if (newDate.new) {
        await addToMemory("Date: " + newDate.date);
    }
    const newBotField = convo.querySelector('.bot');
    const botResponse = await getBotResponse("Start");
    newBotField.innerHTML = botResponse;
    return newDate;
}

randomDate();
resetter.addEventListener('click', async (c) => {
    await reset();
    randomDate();
})

const convo = document.querySelector('.convo');
const oldConvo = document.querySelector('.old-convo');

async function saveConversation() {
    // Re-select the input field after it has been replaced
    const inputField = convo.querySelector('.user .response');

    // Check if there is input to save
    if (inputField && inputField.value.trim() !== '') {
        // Get the input text
        const userText = inputField.value;

        // Set the text content of the .user span and remove the input field
        const userSpan = convo.querySelector('.user');
        userSpan.textContent = userText; // Set text content to user's input

        // Clone the convo and add it to old-convo
        const convoClone = convo.cloneNode(true);
        oldConvo.prepend(convoClone);

        // Restore the input element and the enter image button for new responses
        userSpan.innerHTML = '<input class="response" placeholder="Enter response"><img src="./imgs/enter.png" class="enter">';

        // Re-select the new input field and the new image button
        const newInputField = convo.querySelector('.user .response');
        const newImgButton = convo.querySelector('.enter');
        const newBotField = convo.querySelector('.bot');
        newBotField.innerHTML = '';
        await addToMemory("User responded: " + userText);
        const botResponse = await getBotResponse("Your Turn");
        newBotField.innerHTML = botResponse;
        // Attach the Enter key event to the new input field
        newInputField.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveConversation();
            }
        });

        // Attach the click event to the new image button
        newImgButton.addEventListener('click', await saveConversation);
    } else {
        alert('Please enter a response before saving!');
    }
}

// Initial event listener for pressing "Enter" in the input field
const initialInputField = convo.querySelector('.user .response');
initialInputField.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        await saveConversation();
    }
});

// Initial event listener for the image button click
const initialImgButton = document.querySelector('.enter');
initialImgButton.addEventListener('click', saveConversation);

//-----------------------