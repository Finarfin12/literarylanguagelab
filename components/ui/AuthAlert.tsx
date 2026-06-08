"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";

export default function AuthAlert({ error }: { error?: string }) {
  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Oops...",
        text: error,
        icon: "error",
        background: "#1c1c1c",
        color: "#ededed",
        confirmButtonColor: "#3ecf8e",
        customClass: {
          popup: "border border-border rounded-2xl",
        }
      });
    }
  }, [error]);
  
  return null;
}
