// import { memo } from "react";
// import { PageProps } from "keycloakify/lib/KcProps";
// import { KcContext } from "keycloakify/lib/KcContext";

// export default memo(({ kcContext }: PageProps<{ kcContext: KcContext }>) => {
//     const { message, url, realm } = kcContext;
    
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
//             <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
//                 {/* Logo */}
//                 <div className="text-center mb-8">
//                     <div className="flex justify-center mb-4">
//                         <img src="/logo.png" alt="RishiKirti" className="h-12" />
//                     </div>
//                     <h1 className="text-2xl font-bold text-gray-800">RishiKirti Projects</h1>
//                     <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
//                 </div>

//                 {/* Error Message */}
//                 {message && message.type === "error" && (
//                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
//                         {message.summary}
//                     </div>
//                 )}

//                 {/* Login Form */}
//                 <form action={url.loginAction} method="post">
//                     {/* Username Field */}
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Username or email
//                         </label>
//                         <input
//                             type="text"
//                             name="username"
//                             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
//                             autoFocus
//                         />
//                     </div>

//                     {/* Password Field */}
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Password
//                         </label>
//                         <input
//                             type="password"
//                             name="password"
//                             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
//                         />
//                     </div>

//                     {/* Remember Me */}
//                     <div className="flex items-center justify-between mb-6">
//                         <label className="flex items-center">
//                             <input type="checkbox" name="rememberMe" className="mr-2" />
//                             <span className="text-sm text-gray-600">Remember me</span>
//                         </label>
//                         <a href={url.loginResetCredentialsUrl} className="text-sm text-purple-600 hover:text-purple-700">
//                             Forgot password?
//                         </a>
//                     </div>

//                     {/* Submit Button */}
//                     <button
//                         type="submit"
//                         className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#6C4BAE] text-white py-2 rounded-lg font-semibold hover:from-[#6C4BAE] hover:to-[#1a1a2e] transition"
//                     >
//                         Sign In
//                     </button>
//                 </form>

//                 {/* Info Box */}
//                 <div className="mt-6 p-3 bg-purple-50 rounded-lg">
//                     <p className="text-xs text-purple-600 text-center">
//                         Secured by Keycloak SSO
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// });