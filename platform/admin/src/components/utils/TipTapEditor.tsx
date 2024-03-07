import React, {useEffect} from 'react';
import {BubbleMenu, EditorContent, useEditor} from '@tiptap/react';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import Document from '@tiptap/extension-document';
import Gapcursor from '@tiptap/extension-gapcursor';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import {Toggle} from '@/components/ui/toggle';
import {
    LucideBold,
    LucideItalic,
    LucideStrikethrough,
    LucideCode,
    LucideHeading1,
    LucideHeading2,
    LucideHeading3,
    LucideHeading4,
    LucideHeading5,
    LucideHeading6,
    LucideAlignLeft,
    LucideAlignCenter,
    LucideAlignRight,
    LucideAlignJustify,
    LucideList,
    LucideListOrdered,
    LucideLink,
    LucideFileSymlink
} from 'lucide-react';
import styles from './TipTap.module.css';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';

type OnLinkCallbackFn = (url: string, title: string) => void;

interface TipTapEditorProps {
    controlKey: number;
    content: string;
    onChange: (html: string) => void;
    onLink?: (cb: OnLinkCallbackFn) => void;
}

export function TipTapEditor(props: TipTapEditorProps) {
    const {controlKey, content, onChange, onLink} = props;
    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'prose-fixed'
            }
        },
        extensions: [
            Document,
            Paragraph,
            Text,
            Bold,
            Code,
            Italic,
            Strike,
            ListItem,
            BulletList,
            History,
            Gapcursor,
            HardBreak,
            Placeholder.configure({
                placeholder: 'Write something …',
            }),
            Heading.configure({
                levels: [1, 2, 3, 4, 5, 6],
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            OrderedList,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    rel: null,
                    target: null,
                },
            })
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor) {
            editor.commands.setContent(content);
        }
    }, [controlKey]);

    const handleTransformTextClick = (transformType: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (editor) {
            const currentCursorPosition = editor.state.selection.from;
            let attributes: any = editor.state.selection.$from.node().attrs;
            let textAlign: string = '';
            if (attributes) {
                textAlign = attributes.textAlign;
            }
            if (transformType === 'bold') {
                editor.chain().focus().toggleBold().run();
            } else if (transformType === 'italic') {
                editor.chain().focus().toggleItalic().run();
            } else if (transformType === 'strike') {
                editor.chain().focus().toggleStrike().run();
            } else if (transformType === 'code') {
                editor.commands.toggleCode();
            } else if (transformType === 'h1') {
                editor.chain().focus().toggleHeading({ level: 1 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'h3') {
                editor.chain().focus().toggleHeading({ level: 3 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'h4') {
                editor.chain().focus().toggleHeading({ level: 4 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'h5') {
                editor.chain().focus().toggleHeading({ level: 5 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'h6') {
                editor.chain().focus().toggleHeading({ level: 6 }).setTextAlign(textAlign).setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'bulletlist') {
                editor.chain().focus().toggleBulletList().setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'orderedlist') {
                editor.chain().focus().toggleOrderedList().setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'text-right') {
                editor.chain().focus().setTextAlign('right').setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'text-left') {
                editor.chain().focus().setTextAlign('left').setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'text-center') {
                editor.chain().focus().setTextAlign('center').setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'text-justify') {
                editor.chain().focus().setTextAlign('justify').setTextSelection(currentCursorPosition).run();
            } else if (transformType === 'link') {
                const previousUrl = editor.getAttributes('link').href;
                const url = window.prompt('URL', previousUrl);
                // cancelled
                if (url === null) {
                    return;
                }
                // empty
                if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    return;
                }
                // update link
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            } else if (transformType === 'link_internal') {
                if (onLink) {
                    onLink((url: string, title: string) => {
                        if (url === null) {
                            return;
                        }
                        // empty
                        if (url === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run();
                            return;
                        }
                        // update link
                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    });
                }
            }
        }
    };

    return (
        <>
            {editor &&
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{duration: 100, maxWidth: 'none', zIndex: 45}}
                >
                    <div className="bg-white flex flex-row gap-2 items-center rounded-md w-full border-[1px] border-slate-200 shadow p-1">
                        <Toggle size="xs" onClick={handleTransformTextClick('bold')}>
                            <LucideBold className="w-4 h-4" />
                        </Toggle>
                        <Toggle size="xs" onClick={handleTransformTextClick('italic')}>
                            <LucideItalic className="w-4 h-4" />
                        </Toggle>
                        <Toggle size="xs" onClick={handleTransformTextClick('strike')}>
                            <LucideStrikethrough className="w-4 h-4" />
                        </Toggle>
                        <Toggle size="xs" onClick={handleTransformTextClick('code')}>
                            <LucideCode className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 1})}
                            onClick={handleTransformTextClick('h1')}
                        >
                            <LucideHeading1 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 2})}
                            onClick={handleTransformTextClick('h2')}
                        >
                            <LucideHeading2 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 3})}
                            onClick={handleTransformTextClick('h3')}
                        >
                            <LucideHeading3 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 4})}
                            onClick={handleTransformTextClick('h4')}
                        >
                            <LucideHeading4 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 5})}
                            onClick={handleTransformTextClick('h5')}
                        >
                            <LucideHeading5 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('heading', {level: 6})}
                            onClick={handleTransformTextClick('h6')}
                        >
                            <LucideHeading6 className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            onClick={handleTransformTextClick('text-left')}
                        >
                            <LucideAlignLeft className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            onClick={handleTransformTextClick('text-center')}
                        >
                            <LucideAlignCenter className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            onClick={handleTransformTextClick('text-right')}
                        >
                            <LucideAlignRight className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            onClick={handleTransformTextClick('text-justify')}
                        >
                            <LucideAlignJustify className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('bulletList')}
                            onClick={handleTransformTextClick('bulletlist')}
                        >
                            <LucideList className="w-4 h-4" />
                        </Toggle>
                        <Toggle
                            size="xs"
                            pressed={editor.isActive('orderedList')}
                            onClick={handleTransformTextClick('orderedlist')}
                        >
                            <LucideListOrdered className="w-4 h-4" />
                        </Toggle>
                        <TooltipWrapper text="Set or remove link">
                            <Toggle
                                size="xs"
                                pressed={editor.isActive('link')}
                                onClick={handleTransformTextClick('link')}
                            >
                                <LucideLink className="w-4 h-4" />
                            </Toggle>
                        </TooltipWrapper>
                        <TooltipWrapper text="Choose a page for the link">
                        <Toggle
                            size="xs"
                            onClick={handleTransformTextClick('link_internal')}
                        >
                            <LucideFileSymlink className="w-4 h-4" />
                        </Toggle>
                        </TooltipWrapper>
                    </div>
                </BubbleMenu>}
            <EditorContent className={styles.root} editor={editor}/>
        </>
    );
}
