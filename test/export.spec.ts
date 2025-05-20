import { type ICore, Event as CoreEvent } from "@boardmeister/antetype-core";
import Core from "@boardmeister/antetype-core/dist/core";
import { Herald } from "@boardmeister/herald";
import type { IWorkspaceSettings } from "@src/module";
import Workspace from "@src/module";
import {
  initialize, close,
  generateRandomLayer,
} from "test/helpers/definition.helper";
import exportBase64 from 'test/asset/export.base64';

/**
 * This suit will fail in browser as unless chrome is used. Different browsers differently generate canvas to base64
 */
describe('Workspace export', () => {
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

  it('is properly drawn', async () => {
    await initialize(herald, [
      generateRandomLayer('drawRect')
    ], {
      workspace: {
        height: 1,
        width: 1,
      } as IWorkspaceSettings
    });

    const ctx = canvas.getContext("2d")!;

    herald.batch([
      {
        event: CoreEvent.DRAW,
        subscription: () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(10, 10, 180, 180);
        }
      }
    ])
    const blob = await workspace.export({ dpi: 17.15 }); // To get ideal 200x200
    const result = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function(){ resolve(this.result) };
      reader.readAsDataURL(blob);
    });

    expect(exportBase64).toBe(result);
  });
});