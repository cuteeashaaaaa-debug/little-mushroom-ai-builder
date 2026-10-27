import { useParams } from 'react-router-dom';
import { allUnits } from '../data/courses';

export function UnitPage() {
  const { id } = useParams();
  const unit = allUnits.find(u => u.id === id);
  return <section className="panel unit-detail"><div className="eyebrow">{unit?.moduleId} · {id}</div><h1>{unit?.title ?? '课程单元'}</h1><div className="notice">本单元尚未发布，当前为课程结构预览。正式内容发布后可在此学习并记录进度。</div>{unit&&<><h2>学习目标</h2><ul>{unit.objectives.map(x=><li key={x}>{x}</li>)}</ul><h2>前置知识</h2><p>{unit.prerequisites.length?unit.prerequisites.join('、'):'暂无前置要求'}</p><span className="planned">计划中</span></>}</section>;
}
