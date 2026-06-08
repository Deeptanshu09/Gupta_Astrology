import datetime
import math

def calculate_julian_date(year, month, day, hour_utc):
    """Calculates Decimal Ephemeris Julian Date positions from standard UTC timelines."""
    if month <= 2:
        year -= 1
        month += 12
    a = math.floor(year / 100)
    b = 2 - a + math.floor(a / 4)
    jd = math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + day + (hour_utc / 24.0) + b - 1524.5
    return jd

if __name__ == "__main__":
    now = datetime.datetime.utcnow()
    decimal_hour = now.hour + (now.minute / 60.0) + (now.second / 3600.0)
    current_jd = calculate_julian_date(now.year, now.month, now.day, decimal_hour)
    print(f"--- Ephemeris Operations Engine ---")
    print(f"Current System UTC Timestamp: {now.isoformat()}")
    print(f"Calculated Julian Target Vector: {current_jd:.4f}")