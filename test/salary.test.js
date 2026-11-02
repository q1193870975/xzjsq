import test from 'node:test';
import assert from 'node:assert/strict';
import { rates, validSettings, dayState } from '../src/salary.js';
const settings = {salary: 15000, days: 5, start: '09:00', end: '18:00'};
test('monthly salary matches scheduled seconds', () => {
  const r = rates(settings);
  assert.equal(r.duration, 32400);
  assert.ok(Math.abs(r.perSecond * r.duration * 5 * 52 / 12 - 15000) < 1e-8);
});
test('opening at noon immediately earns three hours without starting a timer', () => {
  const s = dayState(settings, new Date(2026, 10, 2, 12));
  assert.equal(s.elapsed, 10800); assert.equal(s.active, true);
  assert.ok(Math.abs(s.earned - s.daily / 3) < 1e-8);
});
test('before, at start, at end and after work clamp correctly', () => {
  for (const [hour, elapsed, active] of [[8,0,false],[9,0,true],[18,32400,false],[21,32400,false]]) {
    const s = dayState(settings, new Date(2026, 10, 2, hour));
    assert.equal(s.elapsed, elapsed); assert.equal(s.active, active);
  }
});
test('weekends follow workdays count', () => {
  const saturday = new Date(2026,10,7,12);
  assert.equal(dayState(settings,saturday).earned,0);
  assert.equal(dayState({...settings,days:6},saturday).active,true);
  assert.equal(dayState({...settings,days:7},new Date(2026,10,8,12)).active,true);
});
test('new day starts from zero; seconds reflect the current wall clock', () => {
  assert.equal(dayState(settings,new Date(2026,10,3,0)).earned,0);
  const a = dayState(settings,new Date(2026,10,2,12,0,0));
  const b = dayState(settings,new Date(2026,10,2,12,0,1));
  assert.ok(Math.abs(b.earned-a.earned-a.perSecond)<1e-8);
});
test('same time, overnight, malformed and invalid salary inputs are rejected', () => {
  assert.equal(validSettings(settings),true);
  for(const change of [{end:'09:00'},{start:'22:00',end:'06:00'},{start:'25:00'},{salary:0},{days:8}]) assert.equal(validSettings({...settings,...change}),false);
});
