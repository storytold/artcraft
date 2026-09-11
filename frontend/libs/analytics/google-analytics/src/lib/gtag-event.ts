
// Send an event with name and "args". Args is a string-to-string map.
export const gtagEvent = function(eventName: string, args?: { [key: string]: string }) {
  console.debug("gtagEvent", eventName, args);
  if (!args) {
    (window as any).gtag('event', eventName);
  } else {
    (window as any).gtag('event', eventName, args);
  }
}
