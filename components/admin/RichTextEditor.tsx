"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  ImagePlus, Heading1, Heading2, Heading3, Heading4, Quote, Code,
  Undo, Redo, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Highlighter, Palette, Table as TableIcon, Minus,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  ListChecks, Youtube as YoutubeIcon, Type, Trash2, Plus,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Merge, Split,
  Pilcrow, ChevronDown, Upload
} from "lucide-react";
import { useRef, useState, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff",
  "#fed7aa", "#fce7f3", "#ccfbf1",
];

const TEXT_COLORS = [
  "#000000", "#374151", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#64748b",
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-4 mx-auto block shadow-sm border border-gray-100",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: "Start writing your article…",
      }),
      Typography,
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({
        HTMLAttributes: {
          class: "rounded-lg overflow-hidden my-4 mx-auto",
        },
      }),
      CharacterCount,
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] p-5 text-gray-800",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                uploadAndInsertImage(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  const uploadAndInsertImage = useCallback(async (file: File) => {
    if (!editor) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert("Failed to upload image");
      }
    } catch {
      alert("Something went wrong uploading file");
    }
  }, [editor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndInsertImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addYoutubeVideo = () => {
    const url = window.prompt("Enter YouTube URL");
    if (url) {
      editor?.commands.setYoutubeVideo({ src: url });
    }
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  const ToolbarButton = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        active
          ? "bg-blue-100 text-blue-700 shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-300 bg-white shadow-sm transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">

        {/* Text Style Group */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Type className="h-4 w-4 line-through" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowHeadingMenu(!showHeadingMenu); setShowColorMenu(false); setShowHighlightMenu(false); setShowTableMenu(false); }}
            className={`flex items-center gap-0.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
              editor.isActive("heading") ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Pilcrow className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[140px]">
              <button type="button" onClick={() => { editor.chain().focus().setParagraph().run(); setShowHeadingMenu(false); }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${!editor.isActive("heading") ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                Paragraph
              </button>
              {[1, 2, 3, 4].map(level => (
                <button key={level} type="button"
                  onClick={() => { editor.chain().focus().toggleHeading({ level: level as 1|2|3|4 }).run(); setShowHeadingMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-gray-50 ${
                    editor.isActive("heading", { level }) ? "text-blue-600 font-medium" : "text-gray-700"
                  }`}
                  style={{ fontSize: `${1.1 - level * 0.1}rem`, fontWeight: 600 }}>
                  Heading {level}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowColorMenu(!showColorMenu); setShowHeadingMenu(false); setShowHighlightMenu(false); setShowTableMenu(false); }}
            title="Text Color"
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColorMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50">
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map(color => (
                  <button key={color} type="button"
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorMenu(false); }}
                    className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorMenu(false); }}
                className="w-full mt-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded">
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Highlight Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowHighlightMenu(!showHighlightMenu); setShowHeadingMenu(false); setShowColorMenu(false); setShowTableMenu(false); }}
            title="Highlight"
            className={`p-1.5 rounded-md transition-all ${editor.isActive("highlight") ? "bg-yellow-100 text-yellow-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showHighlightMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50">
              <div className="grid grid-cols-4 gap-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <button key={color} type="button"
                    onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightMenu(false); }}
                    className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightMenu(false); }}
                className="w-full mt-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded">
                Remove
              </button>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
          <ListChecks className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block Elements */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert */}
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Upload Image">
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addYoutubeVideo} title="Embed YouTube Video">
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Table Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowTableMenu(!showTableMenu); setShowHeadingMenu(false); setShowColorMenu(false); setShowHighlightMenu(false); }}
            title="Table"
            className={`p-1.5 rounded-md transition-all ${editor.isActive("table") ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
          {showTableMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
              {!editor.isActive("table") ? (
                <button type="button" onClick={insertTable}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Insert 3×3 Table
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5" /> Add Column After
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().addColumnBefore().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <ArrowLeft className="h-3.5 w-3.5" /> Add Column Before
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <ArrowDown className="h-3.5 w-3.5" /> Add Row After
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().addRowBefore().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <ArrowUp className="h-3.5 w-3.5" /> Add Row Before
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Column
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Row
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().mergeCells().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Merge className="h-3.5 w-3.5" /> Merge Cells
                  </button>
                  <button type="button" onClick={() => { editor.chain().focus().splitCell().run(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Split className="h-3.5 w-3.5" /> Split Cell
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button type="button" onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Delete Table
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Bubble Menu - shows on text selection */}
      {editor && (
        <BubbleMenu editor={editor}
          className="flex items-center gap-0.5 bg-gray-900 text-white rounded-lg shadow-2xl px-1 py-0.5">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded ${editor.isActive("bold") ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded ${editor.isActive("italic") ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded ${editor.isActive("underline") ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={setLink}
            className={`p-1.5 rounded ${editor.isActive("link") ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
            className={`p-1.5 rounded ${editor.isActive("highlight") ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            <Highlighter className="h-3.5 w-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* Floating Menu - shows on empty lines */}
      {editor && (
        <FloatingMenu editor={editor}
          className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-0.5">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Bullet List">
            <List className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Quote">
            <Quote className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Image">
            <ImagePlus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Divider">
            <Minus className="h-4 w-4" />
          </button>
        </FloatingMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer with stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Upload className="h-3 w-3" />
          <span>Drop images to upload</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
