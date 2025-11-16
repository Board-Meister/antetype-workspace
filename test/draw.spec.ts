import type { ICore } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from "@boardmeister/herald";
import type { IWorkspaceSettings } from "@src/type.d";
import Workspace from "@src/module";
import {
  initialize, close,
} from "test/helpers/definition.helper";
import workspaceDrawnBase64 from 'test/asset/ws-drawn.base64';

/**
 * This suit will fail in browser unless chrome is used. Different browsers differently generate canvas to base64
 */
describe('Workspace space', () => {
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
    workspace = new Workspace({ core }, herald);
    core.meta.setCanvas(canvas);
  });

  afterEach(async () => {
    await close(herald);
  })

  it('is properly drawn', async () => {
    await initialize(herald, [], {
      workspace: {
        height: 2,
        width: 1,
      } as IWorkspaceSettings
    });

    workspace.drawWorkspace();
    expect(workspaceDrawnBase64).toBe(canvas.toDataURL());
  });
});