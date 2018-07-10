import * as React from "C:\\Program Files (x86)\\Oni\\resources\\app\\node_modules\\react"
import * as Oni from "C:\\Program Files (x86)\\Oni\\resources\\app\\node_modules\\oni-api"

import { existsSync, lstatSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

const FONT_STEP = 2
const SAVE_FONT_CHANGES = false

export const activate = (oni: Oni.Plugin.Api) => {
    console.log("Config activated.")

    // General helpers
    const currentFile = oni.editors.activeEditor.activeBuffer.filePath
    const currentExtension = oni.editors.activeEditor.activeBuffer.language
    const currentProject = oni.workspace.activeWorkspace

    const isVisualMode = () => oni.editors.activeEditor.mode === "visual"
    const isNormalMode = () => oni.editors.activeEditor.mode === "normal"
    const isNotInsertMode = () => oni.editors.activeEditor.mode !== "insert"
    const isNotCommandLine = () =>
        oni.editors.activeEditor.mode !== "cmdline_normal"
    const isMenuOpen = () => oni.menu.isMenuOpen()

    // Run some setup for my terminal menu.
    const terminals = oni.configuration.getValue("oni.terminals") as any[]

    oni.editors.activeEditor.neovim.command(
        `call Term_toggle_setup(${terminals.length})`
    )

    // Take a screenshot on Control+Enter is pressed
    oni.input.bind("<c-enter>", () => oni.recorder.takeScreenshot())

    // Increase font size
    oni.input.bind("<c-=>", () => increaseFontSize(oni))

    // Decrease font size
    oni.input.bind("<c-->", () => decreaseFontSize(oni))

    // Move about splits easier.
    oni.input.bind("<c-h>", () =>
        oni.editors.activeEditor.neovim.command(`call OniNextWindow('h')<CR>`)
    )
    oni.input.bind("<c-j>", () =>
        oni.editors.activeEditor.neovim.command(`call OniNextWindow('j')<CR>`)
    )
    oni.input.bind("<c-k>", () =>
        oni.editors.activeEditor.neovim.command(`call OniNextWindow('k')<CR>`)
    )
    oni.input.bind("<c-l>", () =>
        oni.editors.activeEditor.neovim.command(`call OniNextWindow('l')<CR>`)
    )

    // Let sneak work when a menu is open.
    // This allows my janky sessions saving code to work,
    // and lets me sneak to the confirm/deny button.
    oni.input.unbind("<c-g>")
    oni.input.bind("<c-g>", "sneak.show", () => isNormalMode())

    oni.input.bind("<s-c-w>", () => makeBookmarksMenu(oni))
    oni.input.bind("<s-c-n>", () => makeTermMenu(oni, terminals))
    oni.input.bind("<s-c-s>", () => makeSessionsMenu(oni))
}

export const deactivate = (oni: Oni.Plugin.Api) => {
    console.log("Config deactivated.")
}

export const configuration = {
    activate,
    deactivate,

    "oni.useDefaultConfig": false,
    "oni.loadInitVim": true,

    "ui.colorscheme": "onedark",

    "editor.renderer": "webgl",
    "editor.fontFamily": "Consolas",
    "editor.fontSize": "14",

    "configuration.showReferenceBuffer": false,

    "tabs.showIndex": true,

    "experimental.welcome.enabled": false,

    "experimental.markdownPreview.enabled": true,
    "experimental.markdownPreview.syntaxTheme": "solarized-dark",

    "experimental.achievements.enabled": true,
    "experimental.learning.enabled": true,
    "experimental.particles.enabled": true,
    "experimental.indentLines.enabled": true,

    "debug.showTypingPrediction": true,
    "debug.showNotificationOnError": true,

    "sidebar.default.open": false,
    "sidebar.marks.enabled": true,
    "sidebar.plugins.enabled": true,

    "vim.setting.autoread": true,

    "autoClosingPairs.enabled": true,
    "autoClosingPairs.default": [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "<", close: ">" },
        { open: "'", close: "'" },
        { open: "`", close: "`" },
        { open: '"', close: '"' },
    ],

    "oni.terminals": [
        { name: "CMD", command: "cmd" },
        { name: "PowerShell", command: "powershell" },
        { name: "Bash", command: "bash" },
        {
            name: "Anaconda",
            command:
                "cmd /K " +
                "F:/ProgramData/Anaconda3/Scripts/activate.bat " +
                "F:/ProgramData/Anaconda3",
        },
    ],

    "oni.plugins.prettier": {
        settings: {
            semi: false,
            tabWidth: 4,
            useTabs: false,
            singleQuote: false,
            trailingComma: "es5",
            bracketSpacing: true,
            jsxBracketSameLine: false,
            arrowParens: "avoid",
            printWidth: 80,
        },
        formatOnSave: true,
        enabled: true,
        allowedFiletypes: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".md",
            ".html",
            ".json",
            ".graphql",
        ],
    },

    "language.tex.tokenRegex": "[/$_a-zA-Z0-9]",

    "language.python.languageServer.command": "",
}

const isDirectory = source => lstatSync(source).isDirectory()
const isFile = source => lstatSync(source).isFile()

const getDirectories = source =>
    readdirSync(source)
        .map(name => join(source, name))
        .filter(isDirectory)
const getFiles = source =>
    readdirSync(source)
        .map(name => join(source, name))
        .filter(isFile)

// Add a bookmarks menu to swap easily between different workspaces.
// Dynamically generated from my Git folder.
function makeBookmarksMenu(oni: Oni.Plugin.Api) {
    const bookmarkMenu = oni.menu.create()

    let gitFolder = "F:\\User Files\\Documents\\Git"

    // Check if the folder exists, else fall back to C:\ Drive.
    // Perhaps look at a better way of having Oni pick up each machine.
    if (!isDirectory(gitFolder)) {
        gitFolder = "C:\\Users\\Ryan\\Documents\\Git"
    }

    const gitProjects = getDirectories(gitFolder)

    let menuItems = gitProjects.map(b => ({
        icon: "bookmark",
        detail: b,
        label: b.split("\\").pop(),
    }))

    // Add the open folder option as well.
    menuItems.unshift({
        icon: "folder-open",
        detail: "Set a folder as the workspace for Oni",
        label: "Open Folder",
    })

    bookmarkMenu.show()
    bookmarkMenu.setItems(menuItems)

    bookmarkMenu.onItemSelected.subscribe(menuItem => {
        if (menuItem && menuItem.label !== "Open Folder") {
            oni.workspace.changeDirectory(menuItem.detail)
        } else if (menuItem && menuItem.label === "Open Folder") {
            oni.workspace.openFolder()
        }
    })
}

// Setup a terminal selection menu.
function makeTermMenu(oni: Oni.Plugin.Api, terminals: any[]) {
    const termMenu = oni.menu.create()

    let termId = 0

    const menuItems = terminals.map(t => ({
        icon: "terminal",
        detail: t.command,
        label: t.name,
        metadata: { id: termId++ },
    })) as any

    termMenu.show()
    termMenu.setItems(menuItems)

    termMenu.onItemSelected.subscribe(menuItem => {
        if (menuItem) {
            oni.editors.activeEditor.neovim.command(
                `call Term_open(${menuItem.metadata.id},` +
                    `"${menuItem.detail}")`
            )
        }
    })
}

// Create a session loading menu.
function makeSessionsMenu(oni: Oni.Plugin.Api) {
    const sessionMenu = oni.menu.create()

    let sessionsFolder = "C:\\Users\\ryan\\AppData\\Local\\nvim\\sessions"

    const vimSessions = getFiles(sessionsFolder)

    const menuItems = vimSessions.map(s => ({
        icon: "window-restore ",
        detail: s,
        label: s
            .split("\\")
            .pop()
            .split(".")[0],
    })) as any

    menuItems.unshift({
        icon: "save",
        detail: "Save the current workspace with s! .",
        label: "Save Workspace",
        pinned: true,
    })

    sessionMenu.show()
    sessionMenu.setItems(menuItems)

    sessionMenu.onItemSelected.subscribe(menuItem => {
        if (menuItem) {
            oni.editors.activeEditor.neovim.command(`source ${menuItem.detail}`)
        }
    })

    sessionMenu.onFilterTextChanged.subscribe(filterText => {
        if (filterText) {
            if (filterText.startsWith("s! ") && filterText.endsWith(".")) {
                const sessionName = filterText.split(" ")[1]
                const checkSave = oni.notifications.createItem()

                checkSave.setContents(
                    "Save Workspace",
                    `Would you like to save workspace ${sessionName}?`
                )

                checkSave.setButtons([
                    {
                        title: "Yes",
                        callback: () => {
                            oni.editors.activeEditor.neovim.command(
                                `Obsession ${sessionsFolder}\\${sessionName}.vim`
                            )
                            checkSave.hide()
                            sessionMenu.hide()
                        },
                    },
                    {
                        title: "No",
                        callback: () => {},
                    },
                ])

                checkSave.show()
            }
        }
    })
}

function increaseFontSize(oni: Oni.Plugin.Api) {
    const currentFontSize = oni.configuration.getValue(
        "editor.fontSize"
    ) as string

    let newFontSize = parseInt(currentFontSize) + FONT_STEP

    oni.configuration.setValues({
        "editor.fontSize": newFontSize,
    })
}

function decreaseFontSize(oni: Oni.Plugin.Api) {
    const currentFontSize = oni.configuration.getValue(
        "editor.fontSize"
    ) as string

    let newFontSize = parseInt(currentFontSize) - FONT_STEP
    newFontSize = newFontSize <= 2 ? 2 : newFontSize

    oni.configuration.setValues({
        "editor.fontSize": newFontSize,
    })
}
