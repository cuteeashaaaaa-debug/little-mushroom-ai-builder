import { describe,it,expect } from 'vitest';
import { lessons } from '../data/lessons';
import { courseModules } from '../data/courses';
import { estimateTokens,sampleIndices,samplingDistribution,scoreQuiz } from '../domain/learning';
describe('U01–U04 content and simulation logic',()=>{
 it('meets the minimum lesson structure and includes direct references',()=>{for(const id of ['U01','U02','U03','U04']){const l=lessons[id];expect(l.goals.length).toBeGreaterThanOrEqual(3);expect(l.sections.length).toBeGreaterThanOrEqual(3);expect(l.quiz.length).toBeGreaterThanOrEqual(3);expect(l.pm.length).toBeGreaterThan(0);expect(l.engineering.length).toBeGreaterThan(0);expect(l.scenario.rubric.length).toBeGreaterThanOrEqual(3);expect(l.references.every(r=>/^https:\/\//.test(r.url)&&r.topic.length>8)).toBe(true);expect(l.acceptance.length).toBeGreaterThanOrEqual(3)}});
 it('places published units in the expected module and retains future planned units',()=>{expect(courseModules[0].units.slice(0,4).map(u=>u.releaseStatus)).toEqual(['published','published','published','published']);expect(courseModules.flatMap(m=>m.units).slice(4).every(u=>u.releaseStatus==='planned')).toBe(true)});
 it('scores objective quiz answers exactly without semantic keyword matching',()=>{expect(scoreQuiz([{id:'a',answer:1},{id:'b',answer:0}],{a:1,b:2})).toEqual({correct:1,total:2,percent:50})});
 it('labels estimator as educational elsewhere and counts CJK plus approximate Latin text',()=>{expect(estimateTokens('你好')).toBe(2);expect(estimateTokens('hello world')).toBe(3)});
 it('applies Temperature argmax and top-p cumulative inclusion with normalized output',()=>{expect(samplingDistribution([.42,.28,.18,.12],0)).toEqual([1,0,0,0]);const p=samplingDistribution([.42,.28,.18,.12],1,.65);expect(p[0]).toBeCloseTo(.6);expect(p.slice(1)).toEqual([.4,0,0]);expect(p.reduce((a,b)=>a+b,0)).toBeCloseTo(1)});
 it('repeats seeded samples and exposes a reproducible changed seed',()=>{const p=samplingDistribution([.42,.28,.18,.12],.8,.9);expect(sampleIndices(p,7,30)).toEqual(sampleIndices(p,7,30));expect(sampleIndices(p,7,30)).not.toEqual(sampleIndices(p,8,30))});
});
