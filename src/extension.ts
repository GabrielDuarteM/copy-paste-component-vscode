"use strict"
import * as vscode from "vscode"
import {
  getDefaultComponentPath,
  copyPasteComponent,
  componentFinder,
} from "copy-paste-component"
import { join, sep as slash, normalize } from "path"
import { lstatSync } from "fs"

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.cpc",
    async (file: vscode.Uri) => {
      const componentPath: string = file.fsPath

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(file)

      if (!workspaceFolder) {
        throw new Error("Workspace folder not found")
      }

      const workspaceFolderFsPath = workspaceFolder.uri.fsPath

      const isValidComponent = await validatePath(
        workspaceFolderFsPath,
        componentPath,
      )

      if (!isValidComponent) {
        return
      }

      const newComponentName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "App",
        prompt: "What is the name of the new component?",
      })

      if (!newComponentName) {
        vscode.window.showErrorMessage(
          `The name "${newComponentName}" is not valid.`,
        )
        return
      }

      const defaultComponentPath = getDefaultComponentPath(
        componentPath,
        newComponentName,
      ).replace(workspaceFolderFsPath + slash, "")

      const newComponentPath = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "App",
        prompt: "What is the location of the new component?",
        value: defaultComponentPath,
      })

      if (!newComponentPath) {
        vscode.window.showErrorMessage(
          `The location "${newComponentPath}" is not valid.`,
        )
        return
      }

      await copyPasteComponent(
        componentPath,
        newComponentName,
        join(workspaceFolderFsPath, newComponentPath),
      )

      vscode.window.showInformationMessage(
        `Component ${newComponentName} successfully created at ${newComponentPath}`,
      )
    },
  )

  context.subscriptions.push(disposable)
}

const validatePath = async (
  workspaceFolder: string,
  componentPath: string,
): Promise<boolean> => {
  const arrComponentPathDenormalized: string[] = await componentFinder(
    workspaceFolder,
  )
  const arrComponentPath = arrComponentPathDenormalized.map(path =>
    normalize(path),
  )

  const pathInfo = lstatSync(componentPath)

  if (pathInfo.isDirectory()) {
    vscode.window.showErrorMessage(
      `The path that you tried to copy is a folder. Please, select the file that contains the component.`,
    )
    return false
  }

  const relativeComponentPath = componentPath.replace(
    workspaceFolder + slash,
    "",
  )

  if (!arrComponentPath.includes(relativeComponentPath)) {
    vscode.window.showErrorMessage(
      `File ${componentPath} is not a valid component.`,
    )
    return false
  }

  return true
}
