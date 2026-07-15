"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef, useEffect, useState } from "react";
import { getMenus } from "@/services/menuService";

interface TinyEditorProps {
  value?: string;
  onChange: (content: string) => void;
}

export default function TinyEditor({ value, onChange }: TinyEditorProps) {
  const editorRef = useRef<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const menusRef = useRef<any[]>([]);

  useEffect(() => {
    getMenus({ page: 1, per_page: 1000 })
      .then((res) => {
        const data = res.data.data ?? res.data ?? [];
        setMenus(data);
        menusRef.current = data;
      })
      .catch(() => {
        setMenus([]);
        menusRef.current = [];
      });
  }, []);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onInit={(_, editor) => (editorRef.current = editor)}
      init={{
        height: 1000,
        menubar: true,
        content_css: [
          "/css/custom.css",
          "/css/bootstrap.min.css",
          "/css/flatpickr.min.css",
          "/css/glightbox.min.css",
          "/css/main.css",
          "/css/swiper-bundle.min.css",
          "/css/util.css",
        ], // load multiple css files
        plugins: [
          "directionality",
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "media",
          "table",
          "insertdatetime",
          "searchreplace",
          "preview",
          "fullscreen",
          "code",
          "help",
          "wordcount",
        ],

        toolbar:
          "undo redo | blocks | " +
          "bold italic underline strikethrough | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | " +
          "link image media table | " +
          "insertMenu | ltr rtl | code preview fullscreen",

        setup: (editor: any) => {
          editor.ui.registry.addMenuButton("insertMenu", {
            text: "Insert Menu",
            fetch: (callback: any) => {
              const items = (menusRef.current || []).map((m: any) => ({
                type: "menuitem",
                text: m.name,
                onAction: () => {
                  // insert a placeholder comment the public renderer can replace
                  const placeholder = `<!-- CMS_MENU:${m.id} -->`;
                  editor.insertContent(placeholder);
                },
              }));

              // fallback item
              if (!items.length) {
                callback([
                  {
                    type: "menuitem",
                    text: "No menus available",
                    onAction: () => {},
                  },
                ]);
                return;
              }

              callback(items);
            },
          });
        },

        // 🔒 LOCK LTR FOREVER
        content_style: `
          html, body {
            direction: ltr !important;
            unicode-bidi: plaintext !important;
            text-align: left !important;
          }
        `,
      }}
      onEditorChange={(content) => onChange(content)}
    />
  );
}
