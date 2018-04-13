import * as React from "C:\\Program Files (x86)\\Oni\\resources\\app\\node_modules\\react"
import * as Oni from "C:\\Program Files (x86)\\Oni\\resources\\app\\node_modules\\oni-api"

import { existsSync, lstatSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

export const activate = (oni: Oni.Plugin.Api) => {
    console.log("Config activated.")

    // General helpers
    const currentFile = oni.editors.activeEditor.activeBuffer.filePath
    const currentExtension = oni.editors.activeEditor.activeBuffer.language
    const currentProject = oni.workspace.activeWorkspace

    // Add a bookmarks menu to swap easily between different workspaces.
    // Dynamically generated from my Git folder.
    const makeBookmarksMenu = () => {
        const bookmarkMenu = oni.menu.create()

        let gitFolder = "F:\\User Files\\My Documents\\Git"

        const isDirectory = source => lstatSync(source).isDirectory()
        const getDirectories = source =>
            readdirSync(source)
                .map(name => join(source, name))
                .filter(isDirectory)

        // Check if the folder exists, else fall back to C:\ Drive.
        // Perhaps look at a better way of having Oni pick up each machine.
        if (!isDirectory(gitFolder)) {
            gitFolder = "C:\\Users\\Ryan\\Documents\\Git"
        }

        const gitProjects = getDirectories(gitFolder)

        let menuItems = gitProjects.map(s => ({
            icon: "bookmark",
            detail: s,
            label: s.split("\\").pop(),
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
    // Needs to have a vim-script setup function called to save references to each
    // terminal.

    const terminals = oni.configuration.getValue("oni.terminals") as any[]

    oni.editors.activeEditor.neovim.command(
        `call Term_toggle_setup(${terminals.length})`
    )

    const makeTermMenu = () => {
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
                    `call Term_open(${menuItem.metadata.id},"${
                        menuItem.detail
                    }")`
                )
            }
        })
    }

    // Take a screenshot on Control+Enter is pressed
    oni.input.bind("<c-enter>", () => oni.recorder.takeScreenshot())

    // Set zoom factor to 1.5 when Control+= is pressed
    oni.input.bind("<c-=>", () =>
        require("electron")
            .remote.getCurrentWindow()
            .webContents.setZoomFactor(1.25)
    )

    // Set zoom factor to 1 when Control+- is pressed
    oni.input.bind("<c-->", () =>
        require("electron")
            .remote.getCurrentWindow()
            .webContents.setZoomFactor(1)
    )

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

    oni.input.bind("<s-c-w>", makeBookmarksMenu)
    oni.input.bind("<s-c-n>", makeTermMenu)
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
    "ui.fontSmoothing": "subpixel-antialiased"
    "configuration.showReferenceBuffer": false,

    "editor.fontFamily": "Fira Code Retina",

    "tabs.showIndex": true,

    "experimental.welcome.enabled": false,
    "experimental.markdownPreview.enabled": true,
    "experimental.achievements.enabled": true,
    "experimental.learning.enabled": true,
    "experimental.particles.enabled": true,

    "debug.showTypingPrediction": true,
    "debug.showNotificationOnError": true,

    "sidebar.default.open": false,
    "sidebar.marks.enabled": false,
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
                "C:/ProgramData/Anaconda3/Scripts/activate.bat " +
                "C:/ProgramData/Anaconda3",
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

    "language.python.languageServer.command": "",
}
