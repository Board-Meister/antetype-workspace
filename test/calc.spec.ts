import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from "@boardmeister/herald";
import type { IWorkspaceSettings } from "@src/module";
import Workspace from "@src/module";
import {
  initialize, close,
} from "test/helpers/definition.helper";

describe('Workspace calculations', () => {
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

  it('properly convert to relative', async () => {
    await initialize(herald, [], {
      workspace: {
        height: 1,
        width: 2,
      } as IWorkspaceSettings
    });

    expect('100w%').toBe(workspace.toRelative(canvas.width, 'x'));
    expect('100h%').toBe(workspace.toRelative(canvas.height/2, 'y'));
    expect('50w%').toBe(workspace.toRelative(canvas.width/2, 'x'));
    expect('50h%').toBe(workspace.toRelative(canvas.height/4, 'y'));
  });

  it('properly convert to absolute', async () => {
    await initialize(herald, [], {
      workspace: {
        height: 1,
        width: 2,
      } as IWorkspaceSettings
    });

    expect(canvas.width).toBe(workspace.calc('100w%'));
    expect(canvas.height/2).toBe(workspace.calc('100h%'));
    expect(canvas.width/2).toBe(workspace.calc('50w%'));
    expect(canvas.height/4).toBe(workspace.calc('50h%'));
    expect(10).toBe(workspace.calc('10'));
    expect(workspace.calc('1a')).toBeNaN();
    expect(10).toBe(workspace.calc('10px'));
    expect(canvas.width).toBe(workspace.calc('100vw'));
    expect(canvas.height/2).toBe(workspace.calc('100vh'));

    expect(canvas.height/2 + 20).toBe(workspace.calc('100vh + 20px'));
    expect(40).toBe(workspace.calc('( 100vh + 20px ) / 2 - 10w%'));
    core.setting.set('workspace.relative.width', 100);
    core.setting.set('workspace.relative.height', 100);
    expect(canvas.width).toBe(workspace.calc('100vw'));
    expect(canvas.height/2).toBe(workspace.calc('100vh'));
    expect(100).toBe(workspace.calc('100w%'));
    expect(100).toBe(workspace.calc('100h%'));
  });
});