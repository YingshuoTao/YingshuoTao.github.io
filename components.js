Vue.component('m-grid', {
    props: {
        row: Number,  // row coordinate
        col: Number,  // column coordinate
    },
    data () {
        return {
            mine: false,  // Boolean, has mine in current grid
            revealed: false,  // Boolean, is revealed (left-clicked)
            marked: false, // Boolean, is marked (right-clicked)
        }
    },
    computed: {
        // Array, the adjacent grids of current grid
        adjacentGrids() {
            let grids = []
            for (let i = this.row - 1; i <= this.row + 1; i++) {
                for (let j = this.col - 1; j <= this.col + 1; j++) {
                    if (i >= 1 && i <= this.$root.rows && j >= 1 && j <= this.$root.cols && !(i === this.row && j === this.col)) {
                        grids.push(this.$root.gridMat[i - 1][j - 1])
                    }
                }
            }
            return grids
        },
        // Number, number of adjacent grids which has mines
        number () {
            return this.adjacentGrids.filter(grid => grid.mine).length
        },
        // String, [ "hidden" / "marked" / "blank" / "numbered" / "boomed" ]
        status () {
            if (!this.revealed && !this.marked) {
                return 'hidden'  // the default unrevealed status
            } else if (!this.revealed && this.marked) {
                return 'marked'  // marked by a flag, protected
            } else if (this.revealed && !this.mine && !this.number) {
                return 'blank'  // revealed with no mines in adjacent grids
            } else if (this.revealed && !this.mine && this.number) {
                return 'numbered'  // revealed with mines in adjacent grids
            } else if (this.revealed && this.mine) {
                return 'boomed'  // revealed with a mine in current grid
            }
        },
        // Object, determined by status
        appearance () {
            switch (this.status) {
                case 'hidden':
                    return {
                        content: ' ',
                        color: 'grey',
                    }
                case 'marked':
                    return {
                        content: String.fromCodePoint(128681),  // flag
                        color: 'yellow',
                    }
                case 'blank':
                    return {
                        content: ' ',
                        color: 'white',
                    }
                case 'numbered':
                    return {
                        content: this.number,
                        color: 'white',
                    }
                case 'boomed':
                    return {
                        content: String.fromCodePoint(128165),  // explosion
                        color: 'red',
                    }
                default:
                    return {
                        content: ' ',
                        color: 'grey',
                    }
            }
        },
    },
    watch: {
        status (val) {
            // whenever a "blank" grid is revealed, recursively reveal the adjacent grids
            if (val === 'blank') this.adjacentGrids.forEach(grid => grid.revealed = true)
        }
    },
    methods: {
        leftClick () {
            // reveal an unmarked grid with leftclick
            if (!this.marked) this.revealed = true
        },
        rightClick () {
            // mark / unmark an unrevealed grid with rightclick
            if (!this.revealed) this.marked = !this.marked
            // reveal the remaining adjacent grids with rightclick when the amount of "marked" adjacent grids is equal to the "number" of current grid
            if (this.revealed && this.number && this.number === this.adjacentGrids.filter(grid => grid.marked).length) {
                this.adjacentGrids.filter(grid => !grid.marked).map(grid => grid.revealed = true)
            }
        },
    },
    template: `
        <v-btn small block :color="appearance.color"
          class="subheading font-weight-bold"
          @click.left="leftClick" @click.right="rightClick">
          {{ appearance.content }}
        </v-btn>
    `
})

Vue.component('m-dialog', {
    props: {
        time: Number,
    },
    data () {
        return {
            display: false,
        }
    },
    methods: {
        reset () {
            this.$root.init()  // reset
            this.display = false
        },
    },
    template: `
        <v-dialog v-model="display" persistent max-width="290">
          <v-card class="text-xs-center">
            <v-layout pa-2 column align-center>
              <v-card-title class="headline font-weight-bold">
                <slot></slot>
              </v-card-title>
              <v-card-text class="font-weight-bold grey--text">
                Elapsed Time: {{ time }}
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" @click="reset">reset</v-btn>
              </v-card-actions>
            </v-layout>
          </v-card>
        </v-dialog>
    `
})

Vue.component('m-panel', {
    data () {
        return {
            display: false,
            valid: true,
            /* configs to modify */
            rows: 20,
            cols: 10,
            mineRatio: 15,
        }
    },
    computed: {
        // (Function), validation rules
        rules() {
            return {
                rows: v => {
                    if (v < 5) return 'Must be greater than or equal to 5!'
                    if (!Number.isInteger(Number(v))) return 'Must be Integer!'
                    return true
                },
                cols: v => {
                    if (v < 5) return 'Must be greater than or equal to 5!'
                    if (!Number.isInteger(Number(v))) return 'Must be Integer!'
                    return true
                },
                mineRatio: v => {
                    if (v < 5 || v > 40) return 'Must be beween 5 and 40!'
                    return true
                },
            }
        },
        // Number, expected number of mines
        mines () {
            return Math.floor(this.rows * this.cols * this.mineRatio / 100)
        },
        // String, determined by the mine ratio
        difficulty () {
            if (this.mineRatio < 10) {
                return 'Casual'
            } else if (this.mineRatio < 15) {
                return 'Easy'
            } else if (this.mineRatio < 20) {
                return 'Medium'
            } else if (this.mineRatio < 25) {
                return 'Hard'
            } else if (this.mineRatio < 30) {
                return 'Expert'
            } else {
                return 'Insane'
            }
        },
    },
    methods: {
        confirm () {
            // check validation
            if (this.$refs.form.validate()) {
                this.$root.rows = Number(this.rows)
                this.$root.cols = Number(this.cols)
                this.$root.mineRatio = Number(this.mineRatio)
                // avoid potential problems while rebuilding DOM
                this.$root.gridArr.forEach(grid => {
                    grid.revealed = false
                })
                // async is necessary to ensure the new configs work properly
                this.$nextTick(() => {
                    this.$root.build()
                    this.display = false
                })
            }
        },
        cancel () {
            this.display = false
        },
    },
    template: `
        <v-dialog v-model="display" persistent max-width="500">
          <v-card class="text-xs-center">
            <v-layout pa-2 column align-center>
              <v-card-title class="headline font-weight-bold">
                <v-icon large>settings</v-icon>Settings
              </v-card-title>
              <v-card-text>
                <v-form v-model="valid" ref="form">
                  <v-text-field v-model="rows" :rules="[rules.rows]" type="number" label="Rows"></v-text-field>
                  <v-text-field v-model="cols" :rules="[rules.cols]" type="number" label="Columns"></v-text-field>
                  <v-text-field v-model="mineRatio" :rules="[rules.mineRatio]" type="number" label="Mine Ratio" suffix="%"></v-text-field>
                  <v-flex class="grey--text">Total Mines: {{ mines }} &nbsp;&nbsp;&nbsp;&nbsp; Difficulty: {{ difficulty }}</v-flex>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" @click="confirm">confirm</v-btn>
                <v-btn color="primary" @click="cancel">cancel</v-btn>
              </v-card-actions>
            </v-layout>
          </v-card>
        </v-dialog>
    `
})