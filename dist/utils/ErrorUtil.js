export function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
export function messageOrJsonToMessage(errorMessage) {
    let message = errorMessage;
    try {
        const parsed = JSON.parse(message.substring(message.indexOf('{')));
        message = parsed.error?.message || 'Quota Exceeded/API Error';
    }
    catch {
        message = message.split('\n')[0];
    }
    return message;
}
