"""
Data Processing Helper Functions

Utilities for common data transformation and processing operations.
"""
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta


def series_to_dict(series: List[Dict[str, Any]], value_key: str = "value") -> Dict[str, float]:
    """
    Convert a time series list to a date-keyed dictionary.
    Filters out None values.
    
    Args:
        series: List of dicts with 'date' and value key
        value_key: Key name for the value field (default: "value")
    
    Returns:
        Dictionary mapping dates to values
    """
    return {
        x["date"]: x[value_key]
        for x in series
        if x.get(value_key) is not None
    }


def find_common_dates(*series_dicts: Dict[str, float]) -> List[str]:
    """
    Find common dates across multiple series dictionaries.
    
    Args:
        *series_dicts: Variable number of date-keyed dictionaries
    
    Returns:
        Sorted list of common dates
    """
    if not series_dicts:
        return []
    
    common: Set[str] = set(series_dicts[0].keys())
    for series_dict in series_dicts[1:]:
        common &= set(series_dict.keys())
    
    return sorted(common)


def forward_fill_series(
    series_dict: Dict[str, float],
    all_dates: List[str]
) -> List[float]:
    """
    Forward-fill a series dictionary across a list of dates.
    
    Args:
        series_dict: Date-keyed dictionary with values
        all_dates: Sorted list of dates to fill
    
    Returns:
        List of forward-filled values
    """
    filled = []
    last_value = None
    
    for date in all_dates:
        if date in series_dict:
            last_value = series_dict[date]
        if last_value is not None:
            filled.append(last_value)
    
    return filled


def align_series_by_dates(
    *series_with_dates: tuple[List[Dict[str, Any]], str]
) -> tuple[List[str], List[List[float]]]:
    """
    Align multiple series by their common dates and forward-fill.
    
    Args:
        *series_with_dates: Tuples of (series_list, value_key)
    
    Returns:
        Tuple of (common_dates, list_of_aligned_series)
    """
    # Convert all series to dictionaries
    series_dicts = [
        series_to_dict(series, value_key)
        for series, value_key in series_with_dates
    ]
    
    # Get union of all dates
    all_dates_set: Set[str] = set()
    for series_dict in series_dicts:
        all_dates_set.update(series_dict.keys())
    all_dates = sorted(all_dates_set)
    
    # Forward-fill each series
    aligned = [
        forward_fill_series(series_dict, all_dates)
        for series_dict in series_dicts
    ]
    
    # Filter to only dates where all series have values
    valid_indices = [
        i for i in range(len(all_dates))
        if all(i < len(series) for series in aligned)
    ]
    
    filtered_dates = [all_dates[i] for i in valid_indices]
    filtered_series = [
        [series[i] for i in valid_indices]
        for series in aligned
    ]
    
    return filtered_dates, filtered_series


def calculate_mom_pct(values: List[float]) -> List[float]:
    """
    Calculate month-over-month percentage change.
    First value is 0.0.
    
    Args:
        values: List of raw values
    
    Returns:
        List of MoM percentage changes
    """
    if not values:
        return []
    
    mom = [0.0]
    for i in range(1, len(values)):
        if values[i - 1] != 0:
            pct = ((values[i] - values[i - 1]) / values[i - 1]) * 100
        else:
            pct = 0.0
        mom.append(pct)
    
    return mom


def get_date_range(days: int, start_from: Optional[datetime] = None) -> tuple[str, str]:
    """
    Get a date range for data fetching.
    
    Args:
        days: Number of days to go back
        start_from: Starting datetime (defaults to now)
    
    Returns:
        Tuple of (start_date_str, end_date_str) in YYYY-MM-DD format
    """
    end_date = start_from or datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return (
        start_date.strftime("%Y-%m-%d"),
        end_date.strftime("%Y-%m-%d")
    )


def filter_series_by_cutoff(
    values: List[Any],
    cutoff_date: datetime,
    date_field: str = "timestamp"
) -> List[Any]:
    """
    Filter a list of records by a cutoff date.
    
    Args:
        values: List of records with date field
        cutoff_date: Datetime to filter from
        date_field: Name of the date field
    
    Returns:
        Filtered list of records
    """
    return [
        v for v in values
        if getattr(v, date_field, None) and getattr(v, date_field) >= cutoff_date
    ]
