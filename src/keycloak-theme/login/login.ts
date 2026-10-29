// // src/keycloak-theme/login/login.ts
// import { createRoot } from "react-dom/client";
// import { getKcContext } from "keycloakify";
// import { KcApp } from "./KcApp"; // Aap yahan apna main component import karenge
// import "./main.css"; // Tailwind CSS yahan import karein

// const { kcContext } = getKcContext({
//   // Local testing ke liye mock data (optional)
//   mockPageId: "login.ftl",
// });

// const container = document.getElementById("root")!;
// const root = createRoot(container);

// if (kcContext !== undefined) {
//   root.render(<KcApp kcContext={kcContext} />);
// } else {
//   root.render(<div>Error: Keycloak context not found</div>);
// }