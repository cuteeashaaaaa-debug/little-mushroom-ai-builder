import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ApiDebugLab, RagFlowLab, StructuredOutputLab, ToolCallingLab } from '../components/ExperimentsBatch2';

afterEach(() => cleanup());

describe('U05–U08 local experiments', () => {
  it('shows separate syntax, schema, and business results for an invalid example', () => {
    render(<StructuredOutputLab />);
    fireEvent.change(screen.getByLabelText('验证案例'), { target: { value: 'syntax' } });
    expect(screen.getByText('JSON 语法 · 未通过')).toBeInTheDocument();
    expect(screen.getByText('Schema 结构 · 未运行')).toBeInTheDocument();
    expect(screen.getByText('业务语义 · 未运行')).toBeInTheDocument();
  });

  it('simulates a successful request and streams incremental output', async () => {
    render(<ApiDebugLab />);
    fireEvent.click(screen.getByRole('button', { name: '发送模拟请求' }));
    expect(await screen.findByText(/200 · 正常同步成功/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('场景'), { target: { value: 'stream' } });
    fireEvent.click(screen.getByRole('button', { name: '发送模拟请求' }));
    await waitFor(() => expect(screen.getByText(/200 · response.completed/)).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByText(/收到结束事件/)).toBeInTheDocument();
  });

  it('lets the learner cancel a pending request and reports unknown server state', async () => {
    render(<ApiDebugLab />);
    fireEvent.change(screen.getByLabelText('场景'), { target: { value: 'timeout' } });
    fireEvent.click(screen.getByRole('button', { name: '发送模拟请求' }));
    fireEvent.click(await screen.findByRole('button', { name: '取消等待' }));
    expect(await screen.findByText(/用户已取消等待 · 服务端状态可能未知/)).toBeInTheDocument();
  });

  it('refuses unsafe retries after a timeout unless replay is confirmed', () => {
    render(<ApiDebugLab />);
    fireEvent.change(screen.getByLabelText('场景'), { target: { value: 'timeout' } });
    expect(screen.getByRole('button', { name: /手动安全重试/ })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('我已确认该请求可安全重放/已有幂等保护'));
    expect(screen.getByRole('button', { name: /手动安全重试/ })).toBeEnabled();
  });

  it('requires explicit execution and returns only the simulated tool result', () => {
    render(<ToolCallingLab />);
    fireEvent.click(screen.getByRole('button', { name: '模拟模型提出调用' }));
    expect(screen.getByRole('button', { name: '检查参数' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '检查参数' }));
    fireEvent.click(screen.getByRole('button', { name: '检查用户权限' }));
    fireEvent.click(screen.getByRole('button', { name: '决定执行工具' }));
    expect(screen.getAllByText(/只读模拟查询已执行：1240 万元/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '将结果返回模型' }));
    expect(screen.getAllByText(/工具结果 call_id=call_demo_01 返回模型/).length).toBeGreaterThan(0);
  });

  it('blocks a user without regional access before tool execution', () => {
    render(<ToolCallingLab />);
    fireEvent.change(screen.getByLabelText('用户请求'), { target: { value: 'forbidden' } });
    fireEvent.change(screen.getByLabelText('模拟身份'), { target: { value: 'Analyst-B' } });
    fireEvent.click(screen.getByRole('button', { name: '模拟模型提出调用' }));
    fireEvent.click(screen.getByRole('button', { name: '检查参数' }));
    fireEvent.click(screen.getByRole('button', { name: '检查用户权限' }));
    expect(screen.getByText(/权限不足，工具被拒绝/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '决定执行工具' })).toBeDisabled();
  });

  it('runs local retrieval only after submission and flags unsupported citations', () => {
    render(<RagFlowLab />);
    expect(screen.queryByText(/员工差旅制度 · 第 12 页/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '运行本地检索流程' }));
    expect(screen.getByText(/员工差旅制度 · 第 12 页/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('检索场景'), { target: { value: 'multiple' } });
    fireEvent.click(screen.getByRole('button', { name: '运行本地检索流程' }));
    expect(screen.getByText(/员工差旅制度 · 第 12 页/)).toBeInTheDocument();
    expect(screen.getByText(/报销流程 · 第 4 页/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('检索场景'), { target: { value: 'unsupported-citation' } });
    fireEvent.click(screen.getByRole('button', { name: '运行本地检索流程' }));
    expect(screen.getByText(/引用存在，但不支持该预设主张/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('检索场景'), { target: { value: 'no-evidence' } });
    fireEvent.click(screen.getByRole('button', { name: '运行本地检索流程' }));
    expect(screen.getByText(/没有命中候选片段/)).toBeInTheDocument();
    expect(screen.getByText(/无证据：应拒答或澄清/)).toBeInTheDocument();
  });
});
