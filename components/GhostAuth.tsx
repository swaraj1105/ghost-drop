"use client";

import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure this path matches your firebase config file

export default function GhostAuth() {
  useEffect(() => {
    // Silently sign in the user when the app loads
    signInAnonymously(auth)
      .then((userCredential) => {
        console.log("Ghost Protocol: Uplink Secured (ID: " + userCredential.user.uid.slice(0, 5) + "...)");
      })
      .catch((error) => {
        console.error("Ghost Protocol: Connection Refused", error);
      });
  }, []);

  return null; // This component is invisible
}