package models
import(
	"time"
)

type Table struct {
	ID int 
	Mesa int
	LastOrderTime time.Time
	OpenTime time.Time
	CloseTime time.Time
	IDService int 
	Open bool

}


