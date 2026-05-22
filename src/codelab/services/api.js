import axios from 'axios';

// CodeLab API URL — sourced from environment variable (set in .env files)
const CODELAB_API_URL = process.env.REACT_APP_CODELAB_API;

const codeLabClient = axios.create({
    baseURL: CODELAB_API_URL,
});


// Interceptor to attach the main app's JWT token to CodeLab requests
codeLabClient.interceptors.request.use((config) => {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
        config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    console.log(`[CodeLab API] Calling: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
});

// Global error logger to help debug CORS/Network issues
codeLabClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('[CodeLab API] Network Error or CORS issue detected. Please check if the backend is reachable and CORS is enabled.');
        } else {
            console.error(`[CodeLab API] Error ${error.response.status}:`, error.response.data);
        }
        return Promise.reject(error);
    }
);

export const fetchQuestions = async () => {
    const response = await codeLabClient.get(`/questions`);
    return response.data;
};

export const fetchQuestionById = async (id) => {
    const response = await codeLabClient.get(`/questions/${id}`);
    return response.data;
};

export const submitCode = async (questionId, language, code) => {
    const response = await codeLabClient.post(`/submissions`, {
        questionId,
        language,
        code
    });
    return response.data;
};

export const runCode = async (questionId, language, code) => {
    const response = await codeLabClient.post(`/submissions/run`, {
        questionId,
        language,
        code
    });
    return response.data;
};

export const fetchSubmissionsByQuestionId = async (questionId) => {
    const response = await codeLabClient.get(`/submissions/question/${questionId}`);
    return response.data;
};

