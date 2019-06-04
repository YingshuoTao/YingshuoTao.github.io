const app = new Vue({
    el: '#app',
    data: {
        /* basic configs */
        rows: 20,  // Number, total rows of the matrix
        cols: 10,  // Number, total columns of the matrix
        mineRatio: 15,  // Number, ratio of mines in grids
        /* status utils */
        loaded: false, // Boolean, status util
        gridMat: [], // 2d-array of references of grids in [row][col] order
        gridArr: [], // 1d-array of references of grids (row-col)
        /* timer utils */
        timer: '',  // Object, the "timeout" object
        time: 0,  // Number, elapsed time
    },
    // "loaded"s are used to ensure "computed"s are calculated after all components are mounted
    computed: {
        // Number, total amount of mines
        mines () {
            return this.loaded && this.gridArr.filter(grid => grid.mine).length
        },
        // Number, calculated remaining mines (total - marked)
        remaining () {
            return this.loaded && this.mines - this.gridArr.filter(grid => grid.marked).length
        },
        // Boolean, whenever a grid's status turns into "boomed", gameover.
        defeat () {
            return this.loaded && this.gridArr.some(grid => grid.status === 'boomed')
        },
        // Boolean, when all grids without mines are revealed, player wins.
        victory () {
            return this.loaded && !this.gridArr.some(grid => !grid.mine && !grid.revealed)
        },
    },
    // whenever "defeat" / "victory" status turns into true, game ends
    watch: {
        defeat (val) {
            if (val) {
                this.stopTimer()
                this.$refs.defeatDialog.display = true
            }
        },
        victory (val) {
            if (val) {
                this.stopTimer()
                this.$refs.victoryDialog.display = true
            }
        },
    },
    mounted () {
        this.build()
    },
    methods: {
        // build(rebuild) the matrix with fresh new references of grids("gridMat" & "gridArr"), then init(reset)
        build () {
            // status protection
            this.loaded = false
            // the components may be reused while rebuilding DOM, so that sorting is required to make sure the references are in the right order
            this.gridArr = [...this.$refs.grids].sort((a, b) => a.row - b.row)
            // reshape to 2d-array
            this.gridMat = []
            for (let i = 0; i < this.rows; i++) {
                this.gridMat.push(this.gridArr.slice(i * this.cols, (i + 1) * this.cols))
            }
            this.loaded = true
            this.init()
        },
        init () {
            // reset all grids' status
            this.gridArr.forEach(grid => {
                grid.mine = false
                grid.revealed = false
                grid.marked = false
            })
            this.setMines()
            this.startTimer()
        },
        // set exact number of mines into the matrix randomly
        setMines () {
            const mines = Math.floor(this.rows * this.cols * this.mineRatio / 100)
            for (let i = 1; i <= mines; i++) {
                while (true) {
                    let index = Math.floor(Math.random() * this.gridArr.length)
                    if (!this.gridArr[index].mine) {
                        this.gridArr[index].mine = true
                        break
                    }
                }
            }
        },
        config () {
            // sync current configs
            this.$refs.panel.rows = this.rows
            this.$refs.panel.cols = this.cols
            this.$refs.panel.mineRatio = this.mineRatio
            this.$refs.panel.display = true
        },
        /* timer utils */
        // clock ticker
        tick () {
            this.timer = setTimeout(() => {
               this.time += 1
               this.tick()
            }, 1000)
        },
        // reset and start timer
        startTimer () {
            clearTimeout(this.timer)
            this.time = 0
            this.tick()
        },
        // stop(freeze) timer
        stopTimer () {
            clearTimeout(this.timer)
        },
    },
})