from statistics import mean, pstdev


def is_three_sigma_window(values: list[float]):
    if len(values) < 5:
        return False
    m = mean(values)
    sd = pstdev(values)
    if sd == 0:
        return False
    return values[-1] > m + 3*sd

def pct_vs_weekday_baseline(series: list[tuple[int,float]]):
    if len(series) < 8:
        return 0
    *prev, (_, last) = series
    weekday = series[-1][0]
    baseline = [v for w, v in prev if w == weekday][-3:]
    if not baseline:
        return 0
    base = sum(baseline)/len(baseline)
    if base == 0:
        return 0
    return (last - base) / base
