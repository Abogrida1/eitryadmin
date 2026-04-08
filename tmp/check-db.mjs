const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, status, delivery_method')
    .order('order_number', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log('Latest Orders in Database:')
  console.table(data)
}

checkOrders()
