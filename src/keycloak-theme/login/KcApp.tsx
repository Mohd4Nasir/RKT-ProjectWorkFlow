import { KcContext } from "keycloakify/login/KcContext";
import { Button } from "@/components/ui/button"; // Aapka shadcn button
import { Input } from "@/components/ui/input";   // Aapka shadcn input

type Props = {
  kcContext: KcContext;
}

export function KcApp({ kcContext }: Props) {
  const { url, realm } = kcContext;
  
  // Agar login page hai to form dikhao
  if (kcContext.pageId === "login.ftl") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center">
            Login to {realm.displayName}
          </h1>
          <form action={url.loginAction} method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <Input 
                name="username" 
                type="text" 
                placeholder="Enter username" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <Input 
                name="password" 
                type="password" 
                placeholder="Enter password" 
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <div>Unsupported page: {kcContext.pageId}</div>;
}