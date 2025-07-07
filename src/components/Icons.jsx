import React from 'react';

export const GoogleIcon = () => ( <svg className="w-5 h-5" viewBox="0 0 48 48"> <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path> <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path> <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path> <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.128,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path> </svg> );
export const FacebookIcon = () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"> <path d="M22,12c0-5.52-4.48-10-10-10S2,6.48,2,12c0,4.84,3.44,8.87,8,9.8V15H8v-3h2V9.5C10,7.57,11.57,6,13.5,6H16v3h-1.5 C14.22,9,14,9.22,14,9.5V12h2.5l-0.5,3H14v6.8C18.56,20.87,22,16.84,22,12z"></path> </svg> );

export const Icons = {
    delete: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    user: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    image: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
        </svg>
    ),
    link: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
        </svg>
    ),
    tree: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 12v8" /><path d="M12 4v8" /><path d="M12 12H4" /><path d="M12 12h8" /><path d="M4 12v-4a4 4 0 0 1 4-4h0" /><path d="M20 12v-4a4 4 0 0 0-4-4h0" /><path d="M4 12v4a4 4 0 0 0 4 4h0" /><path d="M20 12v4a4 4 0 0 1-4 4h0" />
        </svg>
    ),
    users: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    expand: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m21 21-6-6m6 6v-4m0 4h-4" /><path d="M3 3l6 6m-6-6v4m0-4h4" /><path d="m3 21 6-6m-6 6v-4m0 4h4" /><path d="m21 3-6 6m6-6v4m0-4h-4" />
        </svg>
    ),
    compress: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 15 6 6m-6-6v4m0-4h4" /><path d="M9 9l-6-6m6 6V5m0 4H5" /><path d="m15 9-6 6m6-6v4m0-4h4" /><path d="m9 15 6-6m-6 6V11m0 4H5" />
        </svg>
    ),
    lotus: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" {...props}>
            <path d="M16 4c-1.5 2.5-2.5 5.5-2.5 8.5C13.5 17 16 20 16 20s2.5-3 2.5-7.5C18.5 9.5 17.5 6.5 16 4zM8 12c-2.5 1.5-4.5 4-4.5 7 0 4.5 4.5 7 4.5 7s1-3.5 1-7C9 15 8 12 8 12zm16 0s-1 3-1 7c0 3.5 1 7 1 7s4.5-2.5 4.5-7c0-3-2-5.5-4.5-7zM6.5 22C4.5 22 2 24 2 24s2.5 2 4.5 2c1.5 0 3-1.5 3-1.5S8 22 6.5 22zm19 0c-1.5 0-3 1.5-3 1.5S22.5 26 24 26c2 0 4.5-2 4.5-2s-2.5-2-4.5-2zM16 22c-2.5 0-5 2-5 2s2.5 2 5 2 5-2 5-2-2.5-2-5-2z"/>
        </svg>
    ),
};
