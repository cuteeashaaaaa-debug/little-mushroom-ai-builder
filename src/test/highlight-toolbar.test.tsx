import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UnitPage } from '../pages/UnitPage';

const storage = vi.hoisted(() => ({ getExercise:vi.fn(),getHighlights:vi.fn(),saveHighlight:vi.fn(),deleteHighlight:vi.fn(),saveExercise:vi.fn(),getMicroProgress:vi.fn(),updateMicroProgress:vi.fn() }));
vi.mock('../storage/db',()=>storage);

describe('highlight toolbar pointer sequence',()=>{
 beforeEach(()=>{cleanup();vi.clearAllMocks();storage.getExercise.mockResolvedValue(undefined);storage.getHighlights.mockResolvedValue([]);storage.saveHighlight.mockResolvedValue(undefined);storage.deleteHighlight.mockResolvedValue(undefined);storage.getMicroProgress.mockResolvedValue([]);storage.updateMicroProgress.mockImplementation(async(unitId:string,microLessonId:string,patch:Record<string,unknown>)=>({id:`${unitId}:${microLessonId}`,unitId,microLessonId,status:'in_progress',lastVisitedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...patch}));});
 it('keeps the captured paragraph offsets when pointer selection is cleared before click',async()=>{
  Object.defineProperty(Range.prototype,'getBoundingClientRect',{configurable:true,value:()=>new DOMRect(120,180,80,18)});
  const academy={progress:[],setStatus:vi.fn(),setMastery:vi.fn()} as never;
  render(<MemoryRouter initialEntries={['/courses/U01']}><Routes><Route path="/courses/:id" element={<UnitPage a={academy}/>}/></Routes></MemoryRouter>);
  const paragraph=await screen.findByText(/大语言模型（LLM）是从大量训练数据中学习序列规律的神经网络/);
  const target=paragraph.closest('[data-highlight-target]')!;
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];while(walker.nextNode())nodes.push(walker.currentNode as Text);
  const joined=nodes.map(node=>node.data).join('');
  const start=joined.indexOf('大量训练数据');const end=joined.indexOf('下一个 Token 的概率分布',start)+'下一个 Token 的概率分布'.length;
  const locate=(offset:number)=>{let left=offset;for(const node of nodes){if(left<=node.length)return{node,offset:left};left-=node.length;}return{node:nodes.at(-1)!,offset:nodes.at(-1)!.length};};
  const first=locate(start),last=locate(end),range=document.createRange();range.setStart(first.node,first.offset);range.setEnd(last.node,last.offset);
  const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);
  fireEvent(document,new Event('selectionchange'));fireEvent.mouseUp(target);
  const button=await screen.findByRole('button',{name:'高亮'});
  const toolbar=button.closest('.selection-popover')!;
  fireEvent.pointerEnter(toolbar);fireEvent.pointerDown(toolbar,{pointerId:1});fireEvent.mouseDown(button);selection.removeAllRanges();fireEvent(document,new Event('selectionchange'));fireEvent.mouseUp(button);fireEvent.click(button);
  await waitFor(()=>expect(storage.saveHighlight).toHaveBeenCalledTimes(1));
  expect(storage.saveHighlight).toHaveBeenCalledWith(expect.objectContaining({unitId:'U01',passageId:target.getAttribute('data-highlight-target'),quote:joined.slice(start,end),passageText:joined,startOffset:start,endOffset:end}));
  expect(await screen.findByText('高亮已保存在本机。')).toBeInTheDocument();
  expect(document.querySelector('mark.study-highlight')?.textContent).toBe(joined.slice(start,end));
  fireEvent.click(document.querySelector('mark.study-highlight')!);
  const cancel=await screen.findByRole('button',{name:'取消高亮'});
  fireEvent.pointerEnter(cancel.closest('.selection-popover')!);
  fireEvent.pointerDown(cancel.closest('.selection-popover')!,{pointerId:1});
  fireEvent.click(cancel);
  await waitFor(()=>expect(storage.deleteHighlight).toHaveBeenCalledTimes(1));
  expect(await screen.findByText('已取消这处高亮。')).toBeInTheDocument();
  await waitFor(()=>expect(document.querySelector('mark.study-highlight')).toBeNull());
 });
 it('reports IndexedDB save failures without rendering a saved highlight',async()=>{
  storage.saveHighlight.mockRejectedValueOnce(new Error('IndexedDB denied'));
  const academy={progress:[],setStatus:vi.fn(),setMastery:vi.fn()} as never;
  render(<MemoryRouter initialEntries={['/courses/U01']}><Routes><Route path="/courses/:id" element={<UnitPage a={academy}/>}/></Routes></MemoryRouter>);
  await screen.findByRole('heading',{name:'文本如何成为数字'});
  const target=document.querySelector<HTMLElement>('[data-highlight-target="U01:micro:token-vectors:s0:p0"]')!;
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),nodes:Text[]=[];while(walker.nextNode())nodes.push(walker.currentNode as Text);
  const full=nodes.map(node=>node.data).join(''),start=full.indexOf('Tokenizer 将文本切成'),end=start+'Tokenizer 将文本切成'.length;
  const locate=(offset:number)=>{let left=offset;for(const node of nodes){if(left<=node.length)return{node,offset:left};left-=node.length;}return{node:nodes.at(-1)!,offset:nodes.at(-1)!.length};};
  const a=locate(start),b=locate(end),range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);window.getSelection()!.addRange(range);
  fireEvent(document,new Event('selectionchange'));fireEvent.mouseUp(target);
  const button=await screen.findByRole('button',{name:'高亮'});fireEvent.pointerEnter(button.closest('.selection-popover')!);fireEvent.pointerDown(button.closest('.selection-popover')!,{pointerId:1});fireEvent.click(button);
  expect(await screen.findByText(/IndexedDB denied/)).toBeInTheDocument();
  expect(screen.queryByText('高亮已保存在本机。')).not.toBeInTheDocument();
  expect(document.querySelector('mark.study-highlight')).toBeNull();
 });
});
