import { AgentuityProvider } from "@agentuity/react";
import { TranslateDemo } from "./components/TranslateDemo";

export function App() {
  return (
    <AgentuityProvider>
      <TranslateDemo />
    </AgentuityProvider>
  );
}
