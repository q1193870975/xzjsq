export const MONTH_WEEKS = 52 / 12;
const validTime = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function minutes(time) {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}
export function validSettings(s) {
  return Boolean(s && Number.isFinite(s.salary) && s.salary >= 1 && s.salary <= 100000000 && Number.isInteger(s.days) && s.days >= 1 && s.days <= 7 && validTime(s.start) && validTime(s.end) && minutes(s.end) > minutes(s.start));
}
export function rates({ salary, days, start, end }) {
  const duration = (minutes(end) - minutes(start)) * 60;
  const monthlyDays = days * MONTH_WEEKS;
  const daily = salary / monthlyDays;
  return { duration, daily, perSecond: daily / duration };
}
export function dayState(settings, now = new Date()) {
  const rate = rates(settings);
  const begin = new Date(now), finish = new Date(now);
  begin.setHours(Math.floor(minutes(settings.start) / 60), minutes(settings.start) % 60, 0, 0);
  finish.setHours(Math.floor(minutes(settings.end) / 60), minutes(settings.end) % 60, 0, 0);
  const workday = (now.getDay() + 6) % 7 < settings.days;
  const elapsed = workday ? Math.max(0, Math.min(rate.duration, (now - begin) / 1000)) : 0;
  const active = workday && now >= begin && now < finish;
  const status = !workday ? '今日休息' : now < begin ? '还没上班' : now >= finish ? '已经下班' : '正在赚钱';
  return { ...rate, begin, finish, workday, elapsed, active, status, earned: elapsed * rate.perSecond };
}
