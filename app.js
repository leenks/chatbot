const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");
const deleteButton = document.querySelector("#delete-btn");

let userText = null;
const API_KEY = "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";
const initialHeight = 25; // Altura inicial da caixa de texto

const loadDataFromLocalstorage = () => {
    const themeColor = localStorage.getItem("theme-color");

    // Verifica o tema atual e aplica
    document.body.classList.toggle("light-mode", themeColor === "light_mode");
    localStorage.setItem("theme-color", themeButton.innerText);
    themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";

    const defaultText = `<div class="default-text">
                        <h1>Assistente Personalizado</h1>
                        <p>Inicie uma conversa e explore o poder da Inteligência Artificial.</p>
                        </div>`;

    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

loadDataFromLocalstorage();

const createElement = (html, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = html;
    return chatDiv;
};

const requestQueue = [];
let isProcessingQueue = false;

const processRequestQueue = async () => {
    if (requestQueue.length > 0 && !isProcessingQueue) {
        isProcessingQueue = true;
        const nextRequest = requestQueue.shift();
        await getChatResponse(nextRequest);
        isProcessingQueue = false;
        processRequestQueue(); // Processa a próxima requisição, se houver
    }
};

const getChatResponse = async (incomingChatDiv) => {
    const API_URL = "https://api.openai.com/v1/completions";

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt: userText,
            max_tokens: 2048,
            temperature: 0,
            n: 1,
            stop: null
        })
    };

    try {
        const response = await (await fetch(API_URL, requestOptions)).json();
        const pElement = document.createElement("p");
        pElement.textContent = response.choices[0].text.trim();

        // Remove a animação de dots, e salva os chats no local storage
        incomingChatDiv.querySelector(".typing-animation").remove();
        incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        localStorage.setItem("all-chats", chatContainer.innerHTML);

        // Inicia o processamento da fila para a próxima requisição
        processRequestQueue();
    } catch (error) {
        const pElement = document.createElement("p");
        pElement.classList.add("error");
        pElement.textContent = "Opa, algo deu errado na resposta. Por favor, tente novamente!";
        
        // Remove a animação de dots e exibe a mensagem de erro
        incomingChatDiv.querySelector(".typing-animation").remove();
        incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        localStorage.setItem("all-chats", chatContainer.innerHTML);

        // Inicia o processamento da fila para a próxima requisição
        processRequestQueue();
    }
};

// Isso copia o conteúdo da resposta do robô
const copyResponse = (copyBtn) => {
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
};  

const showTypingAnimation = () => {
    const html = `<div class="chat-content">
        <div class="chat-details">
            <img src="avatar-chat.png" alt="chat-img">
            <div class="typing-animation">
                <div class="typing-dot" style="--delay: 0.2s"></div>
                <div class="typing-dot" style="--delay: 0.3s"></div>
                <div class="typing-dot" style="--delay: 0.4s"></div>
            </div>
        </div>
        <span onclick="copyResponse(this)" class="material-icons-round">content_copy</span>
    </div>`;

    const incomingChatDiv = createElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);

    // Adiciona a requisição à fila
    requestQueue.push(incomingChatDiv);

    // Inicia o processamento da fila
    processRequestQueue();
};

const handleOutgoingChat = () => {
    userText = chatInput.value.trim();
    if(!userText) return;

    chatInput.value = "";
    chatInput.style.height = `${initialHeight}px`;

    const html = `<div class="chat-content">
        <div class="chat-details">
            <img src="avatar-client.png" alt="client-img">
            <p></p>
        </div>
    </div>`;

    const outgoingChatDiv = createElement(html, "outgoing");
    outgoingChatDiv.querySelector("p").textContent = userText;
    document.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(showTypingAnimation, 500);
};

themeButton.addEventListener("click", () => {
    // Toggle body muda a cor do tema pra light ou dark
    document.body.classList.toggle("light-mode");
    localStorage.setItem("theme-color", themeButton.innerText);
    themeButton.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode";
});

// Botão que deleta a conversa toda
deleteButton.addEventListener("click", () => {
    if(confirm("Tem certeza que deseja deletar toda a conversa?")) {
        localStorage.removeItem("all-chats");
        // Não altera o tema ao deletar
        loadDataFromLocalstorage();
    }
});


chatInput.addEventListener("input", () => {
    // Mantém a altura padrão de 25px
    chatInput.style.height = `${initialHeight}px`;
    
    // Aumenta a altura somente se o texto ultrapassar 25px
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 250)}px`;
});

// Diz que se apertar Enter a pergunta envia, e se apertar Shift+Enter ele pula linha
chatInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleOutgoingChat();
    }
});

sendButton.addEventListener("click", handleOutgoingChat);
