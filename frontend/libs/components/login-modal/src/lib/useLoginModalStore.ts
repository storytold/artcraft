// zustand: a small library for shared app state. `create` builds a hook that any component can call to read the state
// and re-render when it changes, without passing props down.
import { create } from "zustand";

// The shared state of the login dialog: whether it is showing, and a counter other code can bump to ask for a re-check.
interface LoginModalStore {
  // True while the login dialog is showing.
  isOpen: boolean;
  // A number that only ever goes up. Components that depend on "who is signed in?" watch it and look again when it
  // changes (it carries no meaning beyond "it changed").
  recheckTrigger: number;
  // Show the dialog.
  openModal: () => void;
  // Hide the dialog.
  closeModal: () => void;
  // Add one to `recheckTrigger` so watchers re-check the signed-in user.
  triggerRecheck: () => void;
}

// The hook other files import (`useLoginModalStore`). `set` merges the object it is given into the state.
export const useLoginModalStore = create<LoginModalStore>((set) => ({
  // The dialog starts closed, and the counter starts at 0.
  isOpen: false,
  recheckTrigger: 0,
  // Flip the flag on or off.
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  // Uses the "function of the old state" form of `set` so two quick calls each add one instead of overwriting each other.
  triggerRecheck: () =>
    set((state) => ({ recheckTrigger: state.recheckTrigger + 1 })),
}));
