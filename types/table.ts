export interface RestaurantTable {
  id:            string
  restaurant_id: string
  name:          string
  capacity:      number
  category:      string
  is_active:     boolean
  image_url:     string | null
  image_urls:    string[]
  x:             number | null
  y:             number | null
  w:             number | null
  h:             number | null
  created_at:    string
}

export interface FloorZone {
  id:            string
  restaurant_id: string
  label:         string
  x:             number
  y:             number
  w:             number
  h:             number
  is_seasonal:   boolean
  is_open:       boolean
  sort_order:    number
  season_start:  string | null
  season_end:    string | null
  created_at:    string
}
