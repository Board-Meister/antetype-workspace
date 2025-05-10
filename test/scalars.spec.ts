import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/src/core";
import { Herald } from "@boardmeister/herald";
import type { IWorkspaceSettings } from "@src/module";
import Workspace from "@src/module";
import {
  initialize, close
} from "test/helpers/definition.helper";

describe('Workspace scalar', () => {
  let workspace: Workspace, core: ICore;
  const herald = new Herald();
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.width = '200px';
  canvas.style.height = '200px';
  document.body.appendChild(canvas);
  beforeEach(() => {
    core = Core({ herald, canvas }) as ICore;
    workspace = new Workspace(canvas, { core }, herald);
  });

  afterEach(async () => {
    await close(herald);
  })

  it('Size is correctly calculated', async () => {
    await initialize(herald, [], {
      workspace: {
        height: 25,
        width: 50,
      } as IWorkspaceSettings
    });

    let size = workspace.getSize();
    expect(size.width).toBe(canvas.width);
    expect(size.height).toBe(canvas.height/2);
    core.setting.set('workspace.height', 75);
    size = workspace.getSize();
    expect(size.width).toBe(canvas.width*(2/3));
    expect(size.height).toBe(canvas.height);
    workspace.setScale(2);
    size = workspace.getSize();
    expect(size.width).toBe(canvas.width*(2/3)*2);
    expect(size.height).toBe(canvas.height*2);
    core.setting.set('workspace', {});
    workspace.setScale(1);
    // Defaults to A4 when no setting provided
    size = workspace.getSize();
    expect(size.height).toBe(canvas.height);
    expect(size.width).toBe(Math.round(canvas.height * 0.707070707));
  });

  it('Scale and Quality properly scale and transforms canvas', async () => {
    await initialize(herald, [], {
      workspace: {
        height: 1,
        width: 1,
      } as IWorkspaceSettings
    });
    expect(canvas.height).toBe(200);
    expect(canvas.width).toBe(200);
    workspace.setQuality(2);
    expect(canvas.height).toBe(400);
    expect(canvas.width).toBe(400);
    expect(canvas.offsetHeight).toBe(200);
    expect(canvas.offsetWidth).toBe(200);
    let size = workspace.getSize();
    expect(size.height).toBe(400);
    expect(size.width).toBe(400);
    workspace.setScale(2);
    size = workspace.getSize();
    expect(size.height).toBe(800);
    expect(size.width).toBe(800);
  })
});