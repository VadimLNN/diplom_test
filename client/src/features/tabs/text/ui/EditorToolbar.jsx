import * as React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import styles from "./EditorToolbar.module.css";

const Separator = () => <Toolbar.Separator className={styles.separator} />;

const Icon = ({ children }) => (
    <span className={styles.icon} aria-hidden="true">
        {children}
    </span>
);

function TButton({ label, disabled, pressed, onClick, children }) {
    return (
        <Tooltip.Root delayDuration={250}>
            <Tooltip.Trigger asChild>
                <Toolbar.Button
                    className={`${styles.button} ${pressed ? styles.buttonActive : ""}`}
                    aria-label={label}
                    aria-pressed={pressed}
                    disabled={disabled}
                    onClick={onClick}
                    type="button"
                >
                    {children}
                </Toolbar.Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} side="bottom" sideOffset={6}>
                    {label}
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

function Dropdown({ label, disabled, trigger, children }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Toolbar.Button className={styles.button} aria-label={label} disabled={disabled} type="button">
                    {trigger}
                </Toolbar.Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className={styles.dropdown} side="bottom" sideOffset={6}>
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function DItem({ onSelect, disabled, active, children }) {
    return (
        <DropdownMenu.Item
            className={`${styles.dropdownItem} ${active ? styles.dropdownItemActive : ""}`}
            onSelect={(e) => {
                e.preventDefault(); // чтобы dropdown не пытался менять focus странно
                onSelect?.();
            }}
            disabled={disabled}
        >
            {children}
        </DropdownMenu.Item>
    );
}

const EditorToolbar = ({ editor }) => {
    if (!editor) return null;

    // helpers
    const run = (fn) => fn(editor.chain().focus()).run();

    return (
        <Tooltip.Provider>
            <Toolbar.Root className={styles.toolbar} aria-label="Editor toolbar">
                {/* Undo / Redo */}
                <TButton label="Undo" disabled={!editor.can().undo()} onClick={() => run((c) => c.undo())}>
                    <Icon>↶</Icon>
                </TButton>

                <TButton label="Redo" disabled={!editor.can().redo()} onClick={() => run((c) => c.redo())}>
                    <Icon>↷</Icon>
                </TButton>

                <Separator />

                {/* Headings */}
                <Dropdown
                    label="Heading"
                    disabled={false}
                    trigger={
                        <>
                            <Icon>H</Icon>
                            <span className="${styles.button}-dropdown">▾</span>
                        </>
                    }
                >
                    <DItem active={editor.isActive("heading", { level: 1 })} onSelect={() => run((c) => c.setHeading({ level: 1 }))}>
                        Heading 1
                    </DItem>
                    <DItem active={editor.isActive("heading", { level: 2 })} onSelect={() => run((c) => c.setHeading({ level: 2 }))}>
                        Heading 2
                    </DItem>
                    <DItem active={editor.isActive("heading", { level: 3 })} onSelect={() => run((c) => c.setHeading({ level: 3 }))}>
                        Heading 3
                    </DItem>
                    <DItem active={editor.isActive("paragraph")} onSelect={() => run((c) => c.setParagraph())}>
                        Paragraph
                    </DItem>
                </Dropdown>

                {/* Lists dropdown (как в демо) */}
                <Dropdown
                    label="List options"
                    trigger={
                        <>
                            <Icon>≡</Icon>
                            <span className={styles.dropdownArrow}>▾</span>
                        </>
                    }
                >
                    <DItem active={editor.isActive("bulletList")} onSelect={() => run((c) => c.toggleBulletList())}>
                        Bullet list
                    </DItem>
                    <DItem active={editor.isActive("orderedList")} onSelect={() => run((c) => c.toggleOrderedList())}>
                        Ordered list
                    </DItem>
                </Dropdown>

                <Separator />

                {/* Blockquote + Code Block */}
                <TButton
                    label="Blockquote"
                    pressed={editor.isActive("blockquote")}
                    disabled={!editor.can().toggleBlockquote()}
                    onClick={() => run((c) => c.toggleBlockquote())}
                >
                    <Icon>❝</Icon>
                </TButton>

                <TButton
                    label="Code Block"
                    pressed={editor.isActive("codeBlock")}
                    disabled={!editor.can().toggleCodeBlock()}
                    onClick={() => run((c) => c.toggleCodeBlock())}
                >
                    <Icon>{"</>"}</Icon>
                </TButton>

                <Separator />

                {/* Marks: bold/italic/strike/code/underline */}
                <Toolbar.ToggleGroup className="tiptap-toolbar-toggle-group" type="multiple" aria-label="Text formatting">
                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive("bold") ? styles.buttonActive : ""}`}
                        value="bold"
                        aria-label="Bold"
                        disabled={!editor.can().toggleBold()}
                        onClick={() => run((c) => c.toggleBold())}
                    >
                        <Icon>B</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive("italic") ? styles.buttonActive : ""}`}
                        value="italic"
                        aria-label="Italic"
                        disabled={!editor.can().toggleItalic()}
                        onClick={() => run((c) => c.toggleItalic())}
                    >
                        <Icon>I</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive("strike") ? styles.buttonActive : ""}`}
                        value="strike"
                        aria-label="Strike"
                        disabled={!editor.can().toggleStrike()}
                        onClick={() => run((c) => c.toggleStrike())}
                    >
                        <Icon>S</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive("code") ? styles.buttonActive : ""}`}
                        value="code"
                        aria-label="Code"
                        disabled={!editor.can().toggleCode()}
                        onClick={() => run((c) => c.toggleCode())}
                    >
                        <Icon>{"<>"}</Icon>
                    </Toolbar.ToggleItem>

                    {/* underline будет работать, только если подключён extension Underline */}
                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive("underline") ? styles.buttonActive : ""}`}
                        value="underline"
                        aria-label="Underline"
                        disabled={!editor.can().toggleUnderline?.() ?? false}
                        onClick={() => editor.chain().focus().toggleUnderline?.().run()}
                    >
                        <Icon>U</Icon>
                    </Toolbar.ToggleItem>
                </Toolbar.ToggleGroup>

                <Separator />

                {/* Align left/center/right/justify (будет работать, если подключён TextAlign) */}
                <Toolbar.ToggleGroup className="tiptap-toolbar-toggle-group" type="single" aria-label="Text alignment">
                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive({ textAlign: "left" }) ? styles.buttonActive : ""}`}
                        value="left"
                        aria-label="Align left"
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    >
                        <Icon>L</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive({ textAlign: "center" }) ? styles.buttonActive : ""}`}
                        value="center"
                        aria-label="Align center"
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    >
                        <Icon>C</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive({ textAlign: "right" }) ? styles.buttonActive : ""}`}
                        value="right"
                        aria-label="Align right"
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    >
                        <Icon>R</Icon>
                    </Toolbar.ToggleItem>

                    <Toolbar.ToggleItem
                        className={`${styles.button} ${editor.isActive({ textAlign: "justify" }) ? styles.buttonActive : ""}`}
                        value="justify"
                        aria-label="Align justify"
                        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    >
                        <Icon>J</Icon>
                    </Toolbar.ToggleItem>
                </Toolbar.ToggleGroup>

                <Separator />

                {/* Image (URL) — будет работать если подключён Image extension */}
                <TButton
                    label="Add image"
                    disabled={false}
                    onClick={() => {
                        const url = window.prompt("Image URL");
                        if (!url) return;
                        editor.chain().focus().setImage({ src: url }).run();
                    }}
                >
                    <Icon>🖼</Icon>
                    <span className={styles.buttonText}>Add</span>
                </TButton>
            </Toolbar.Root>
        </Tooltip.Provider>
    );
};

export default EditorToolbar;
