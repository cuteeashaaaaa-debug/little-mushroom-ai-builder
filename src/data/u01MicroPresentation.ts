import type { U01MicroLesson } from './u01MicroLessons';

// Human-selected semantic emphases: lesson → section → paragraph → exact phrases.
export const u01Emphasis:Record<string,string[][][]>={
 'token-vectors':[
  [['Tokenizer','词表里可识别的片段'],['Token ID','编号顺序没有语义大小'],['目标模型使用对应 Tokenizer']],
  [['Embedding 矩阵 E','取出 E 的第 i 行'],['Token ID 是离散索引','连续向量'],['训练时','推理时']],
  [['位置信息','先后差别'],['初始表示','上下文表示'],['因果遮罩','不能读取尚未生成的未来 Token']]
 ],
 'attention-context':[
  [['Q=XW_Q、K=XW_K、V=XW_V','Query 是当前位置','不是三种现成的外部标签'],['Query 像当前问题','Key 像每份资料的索引特征','Value 像取回后真正送去汇总的内容'],['q·k_i','分数 s_i=q·k_i','√d_k 缩放']],
  [['q=[1,0]','d_k=2','[0.7071,0]'],['注意力权重约为 [0.6698,0.3302]','输出上下文为','单头、两位置'],['缩放除以 √d_k','控制输入 Softmax 的幅度','完整解释'],['q=[1,0]、k₁=k₂=[0,1]','Softmax 权重为 [0.5,0.5]','h=0.5v₁+0.5v₂=[0.9,0.2]']],
  [['因果遮罩','未来位置','权重为 0'],['多头注意力','残差连接','前馈网络'],['隐藏状态映射到候选 Token 的 Logits','不单独等同于推理','事实检索']]
 ],
 'logits-softmax':[
  [['教学隐藏状态 h=[0.9,0.2]','教学假设','偏置都设为 0'],['z_i=w_i·h+b_i','Logit 是未归一化分数','不要求加总为 1'],['所有 Logits 加上同一个常数','Softmax 概率不变','分数差以指数关系影响相对概率']],
  [['Softmax 定义','e^1.8≈6.0496','分母约 7.8061'],['先减去最大 Logit 1.8','分母约 1.2903','避免大正 Logit 指数溢出'],['h 改为 [0.2,0.9]','改变概率分布','不代表候选是事实正确的概率']]
 ],
 'decoding':[
  [['贪心解码','当前概率最大者','不代表这句话必然适合任何场景'],['随机采样按分布抽取候选','即使输入相同，也可能抽到不同 Token','Top-p、Top-k'],['Temperature','不会增加缺失事实','验证正确性']],
  [['追加到前缀','再算下一个 Token 分布','每一步都以当前可见前缀为条件'],['停止 Token','最大输出长度','截断可能让句子未完'],['Temperature=0 也不保证','稳定续写不等于事实正确','仍可能稳定地产生错误内容']]
 ],
 'training':[
  [['目标下一个 Token','L=−ln(p_雨伞)','目标概率越小，损失越大'],['one-hot y=[1,0,0]','交叉熵','负对数似然'],['反向传播用链式法则','梯度不是模型“知道自己错了”的意识','求导所得的数值方向']],
  [['∂L/∂z_i=p_i−y_i','Softmax 的雅可比矩阵','不是经验口诀'],['由链式法则','∂L/∂w_ij=(p_i−y_i)h_j','雨伞权重梯度≈[-0.202507,-0.045002]'],['w_new=w_old−η∇L','固定隐藏向量 h','不是真实 LLM 训练']],
  [['学习率 η=0.1','权重从 [2,0] 更新','提高目标 Logit 的方向'],['雨伞从 77.499% 升至约 78.043%','损失从 0.254902 降至 0.247914','不代表每个复杂网络步骤都必然单调改善所有指标'],['是否执行参数更新','普通用户请求通常不会','独立管线']]
 ],
 'product-application':[
  [['下一 Token 分布','它不是','流畅续写仍可能补出不存在的事实'],['幻觉不能简单归因于随机采样','后训练可调整指令遵循与偏好','检索和工具系统也可能找错'],['低 Temperature','错误续写','不提供新证据']],
  [['用户问','不能因此断定迎合只由下一个 Token 预测造成','对照提示和数据实验'],['用户提出的假设','已验证的业务事实','相关性或先后发生本身不能证明原因'],['说明现有数据能支持什么、缺什么','高风险决策','澄清或人工审核路径']],
  [['可信信息只有','尚无按客群的价格、转化和毛利对照','没有证明折扣导致变化'],['身份与区域权限','参数化只读查询','副作用'],['四类信息','查询期间、口径和更新时间','尚无法归因']]
 ]
};

export function validateU01Emphasis(lessons:U01MicroLesson[]){
 const issues:string[]=[];
 for(const lesson of lessons){const map=u01Emphasis[lesson.id];if(!map||map.length!==lesson.sections.length){issues.push(`${lesson.id}: emphasis section count mismatch`);continue}lesson.sections.forEach((section,si)=>section.paragraphs.forEach((text,pi)=>{const terms=map[si]?.[pi]??[];if(!terms.length)issues.push(`${lesson.id} section ${si+1} paragraph ${pi+1}: no semantic emphasis`);if(terms.length>3)issues.push(`${lesson.id} section ${si+1} paragraph ${pi+1}: more than three emphases`);for(const term of terms)if(!text.includes(term))issues.push(`${lesson.id} section ${si+1} paragraph ${pi+1}: missing term “${term}”`)}))}
 return issues;
}
