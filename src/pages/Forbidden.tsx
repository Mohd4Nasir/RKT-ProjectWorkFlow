import NotFound from "./NotFound";

/** 403 — shown when a logged-in user opens a page their role can't access. */
const Forbidden = () => (
  <NotFound
    code="403"
    title="Access denied"
    message="You don't have permission to view this page. Contact your administrator if you think this is a mistake."
  />
);

export default Forbidden;
