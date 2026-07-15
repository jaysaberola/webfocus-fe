type LoadingStore = {
  start: (text?: string) => void;
  finish: () => void;
};

let store: LoadingStore | null = null;
let pendingStartText: string | null = null;

export const loading = {
  start(text?: string) {
    if (!store) {
      // queue it until provider is ready
      pendingStartText = text || "Loading...";
      return;
    }
    store.start(text);
  },

  finish() {
    if (!store) {
      pendingStartText = null;
      return;
    }
    store.finish();
  },
};

export const registerLoading = (methods: LoadingStore) => {
  store = methods;

  // 🔥 flush pending loading
  if (pendingStartText !== null) {
    store.start(pendingStartText);
    pendingStartText = null;
  }
};
