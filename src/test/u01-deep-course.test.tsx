import { afterEach,describe,expect,it } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import 'fake-indexeddb/auto';
import { U01DeepCourse } from '../components/U01DeepCourse';
import { getMicroProgress } from '../storage/db';
import type { TextHighlight } from '../domain/types';

afterEach(()=>cleanup());
const props={unitId:'UTEST',highlights:[] as TextHighlight[],onHighlightClick:()=>undefined,legacy:<p>legacy</p>};
describe('U01 micro-lesson experience',()=>{
 it('navigates, persists independent completion, and restores the most recently visited micro-lesson',async()=>{
  const view=render(<MemoryRouter><U01DeepCourse {...props}/></MemoryRouter>);
  expect(await screen.findByRole('heading',{name:'文本如何成为数字'})).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:/标记本微课已学/})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:/标记本微课已学/}));
  await waitFor(async()=>expect(await getMicroProgress('UTEST')).toEqual(expect.arrayContaining([expect.objectContaining({microLessonId:'token-vectors',status:'completed'})])));
  fireEvent.click(screen.getByRole('button',{name:/Logits 与 Softmax/}));
  expect(await screen.findByRole('heading',{name:'Logits 与 Softmax'})).toBeInTheDocument();
  await waitFor(async()=>expect(await getMicroProgress('UTEST')).toEqual(expect.arrayContaining([expect.objectContaining({microLessonId:'logits-softmax',status:'in_progress'})])));
  view.unmount();
  render(<MemoryRouter><U01DeepCourse {...props}/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByRole('button',{name:/标记本微课已学/})).toBeEnabled());
  expect(await screen.findByRole('heading',{name:'Logits 与 Softmax'})).toBeInTheDocument();
  await waitFor(()=>expect(screen.getByRole('button',{name:/文本如何成为数字/})).toHaveTextContent('已完成'));
 });
 it('grades independent logits and probabilities using an absolute numeric tolerance',async()=>{
  render(<MemoryRouter><U01DeepCourse {...props}/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByRole('button',{name:/标记本微课已学/})).toBeEnabled());
  fireEvent.click(await screen.findByRole('button',{name:/Logits 与 Softmax/}));
  const values=['0.4','1.2','-0.4','0.2721','0.6056','0.1223'];
  const inputs=screen.getAllByRole('spinbutton');
  for(let i=0;i<values.length;i++)fireEvent.change(inputs[i],{target:{value:values[i]}});
  fireEvent.click(screen.getByRole('button',{name:'提交计算'}));
  expect(await screen.findByText(/通过：最大绝对误差/)).toBeInTheDocument();
  await waitFor(async()=>expect((await getMicroProgress('UTEST')).find(x=>x.microLessonId==='logits-softmax')?.numericalAnswers).toMatchObject({z0:.4,z1:1.2,z2:-.4}));
 });
 it('requires all causal forecasts before showing the explanations and keeps U20 planned',async()=>{
  render(<MemoryRouter><U01DeepCourse {...props}/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByRole('button',{name:/标记本微课已学/})).toBeEnabled());
  fireEvent.click(await screen.findByRole('button',{name:/解码与连续生成/}));
  expect(screen.getByRole('button',{name:'提交三项预测'})).toBeDisabled();
  const selects=screen.getAllByRole('combobox');
  fireEvent.change(selects[0],{target:{value:'保持不变'}});fireEvent.change(selects[1],{target:{value:'上升'}});fireEvent.change(selects[2],{target:{value:'不一定'}});
  fireEvent.click(screen.getByRole('button',{name:'提交三项预测'}));
  expect(await screen.findByText(/共同平移会在 Softmax/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/从模型局限到企业 AI 产品/}));
  expect(await screen.findByText(/U20 引用正确性与 Groundedness · 计划中/)).toBeInTheDocument();
  expect(screen.queryByRole('link',{name:/U20/})).not.toBeInTheDocument();
 });
});
