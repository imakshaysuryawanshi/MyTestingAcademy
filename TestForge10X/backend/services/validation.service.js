export function detectHallucination(output, input) {
    const inputText = JSON.stringify(input).toLowerCase();
    const outputText = output.toLowerCase();

    // Rule 1: Login hallucination
    if (!inputText.includes("login") && outputText.includes("password")) {
        return {
            isHallucinated: true,
            reason: "Login-related content detected without input context"
        };
    }

    // Rule 2: URL mismatch
    if (input.url && !outputText.includes(input.url)) {
        return {
            isHallucinated: true,
            reason: "Output does not use provided URL"
        };
    }

    return { isHallucinated: false };
}