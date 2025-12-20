import { isServer } from "utils/isServer";

// Lazy initialization of head to avoid SSR issues
function getHead() {
    if (isServer) return null;
    return document.head || document.getElementsByTagName('head')[0];
}

export function insertStylesToHead(tag) {
    if (isServer) return;
    const head = getHead();
    if (head) {
        head.appendChild(tag);
    }
}

export function removeStylesFromHead(tag) {
    if (isServer) return;
    const head = getHead();
    if (head && tag.parentNode === head) {
        head.removeChild(tag);
    }
}

export function injectStyles(tag, css) {
    if (isServer) return;
    if (tag.styleSheet) {
        tag.styleSheet.cssText = css;
    } else {
        tag.appendChild(document.createTextNode(css));
    }
}

export function makeStyleTag() {
    if (isServer) return null;
    const tag = document.createElement('style');
    tag.type = 'text/css';
    return tag;
}
